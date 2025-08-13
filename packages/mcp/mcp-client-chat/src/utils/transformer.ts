import type {
  AvailableTool,
  ChatBody,
  ChatCompleteResponse,
  CustomTransportMcpServer,
  IChatOptions,
  MCPClientOptions,
  McpServer,
  Message,
  NonStreamingChoice,
  StreamingChoice,
  ToolCall,
  ToolResults,
} from '../types/index.js';

export function mergeStreamingToolCalls(result: ToolCall[], tool_calls: ToolCall[]): void {
  try {
    tool_calls.forEach((toolCall: ToolCall) => {
      if (!toolCall.id) {
        // 修复：确保 result.at(-1) 存在且 function/arguments 字段存在
        const last = result.at(-1);
        if (last && last.function && typeof toolCall.function?.arguments === 'string') {
          last.function.arguments = last.function.arguments || '';
          last.function.arguments += toolCall.function.arguments;
        }
        return;
      }

      result.push(toolCall);
    });
  } catch (error) {
    console.error(`mergeStreamingToolCalls failed: ${error}`);
  }
}

export function mergeStreamingResponses(responses: ChatCompleteResponse[]): ChatCompleteResponse {
  try {
    const toolCalls: ToolCall[] = [];
    if (responses[0].choices[0].finish_reason === 'error') {
      return responses[0];
    }
    const isStream = 'delta' in responses[0].choices[0];
    const mergedContent = responses
      .flatMap((r) => r.choices)
      .map((choice) => {
        if ('message' in choice) {
          if (choice.message.tool_calls?.length) {
            mergeStreamingToolCalls(toolCalls, choice.message.tool_calls);
          }

          return choice.message?.content ?? '';
        }

        if ('delta' in choice) {
          if (choice.delta.tool_calls?.length) {
            mergeStreamingToolCalls(toolCalls, choice.delta.tool_calls);
          }

          return choice.delta.content ?? '';
        }

        return '';
      })
      .join('');
    const result = {
      ...responses[0], // 以第一个为基础
      choices: [
        {
          ...(responses[0].choices[0] as any),
        },
      ],
    };

    if (isStream) {
      result.choices[0].delta = {
        ...(responses[0].choices[0] as StreamingChoice).delta,
        content: mergedContent,
        tool_calls: toolCalls,
      };
    } else {
      result.choices[0].message = {
        ...(responses[0].choices[0] as NonStreamingChoice).message,
        content: mergedContent,
        tool_calls: toolCalls,
      };
    }

    return result;
  } catch (error) {
    console.error(`mergeStreamingResponses failed: ${error}`);

    return {
      ...responses[0],
      choices: [
        {
          finish_reason: 'error',
          text: 'merge streaming responses failed!',
          error: { code: 400, message: 'merge streaming responses failed!' },
        },
      ],
    };
  }
}

export async function generateStreamingResponses(stream: ReadableStream, streamWriter: (content: string) => Promise<void>): Promise<ChatCompleteResponse> {
  try {
    const reader = stream.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    const result: any[] = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      if (!value || !(value instanceof Uint8Array)) continue;

      buffer += decoder.decode(value, { stream: true });

      // 按行处理
      let lineEnd;
      while ((lineEnd = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, lineEnd).trim();

        buffer = buffer.slice(lineEnd + 1);

        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') break;

          try {
            const obj = JSON.parse(data);

            result.push(obj);

            if (obj.choices[0].delta.content && typeof streamWriter === 'function') {
              await streamWriter(obj.choices[0].delta.content);
            }
          } catch (_error) {
            // 不是合法JSON可忽略或记录
            console.error('invalid streamable response:', data);
          }
        }
      }
    }
    return mergeStreamingResponses(result);
  } catch (error) {
    console.error(error);

    // 返回一个包含必要属性的空对象，防止类型错误
    return {
      id: '',
      object: 'chat.completion.chunk',
      created: 0,
      model: '',
      choices: [
        {
          finish_reason: 'error',
          text: 'parse streamable response failed!',
          error: { code: 400, message: 'parse streamable response failed!' },
        },
      ],
    };
  }
}