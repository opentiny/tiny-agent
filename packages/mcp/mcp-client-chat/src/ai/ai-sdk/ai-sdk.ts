import { generateText, streamText, tool } from 'ai';
import type {
  AssistantContent,
  ModelMessage,
  SystemModelMessage,
  UserModelMessage,
  AssistantModelMessage,
  ToolCallPart,
  ToolModelMessage,
  GenerateTextResult,
  StreamTextResult,
  ToolSet,
  UserContent,
  ToolResultPart,
} from 'ai';
import { BaseAi } from '../base-ai.js';
import type {
  ChatBody,
  ChatCompleteResponse,
  LlmConfig,
  GenerateTextOptions,
  StreamTextOptions,
  LanguageModel,
} from '../../types/index.js';
import { getDefaultModel } from './default-config.js';
import { jsonSchemaToZod, transformChatResult, toOpenAIChunk } from '../../utils/index.js';

type AiSDKConfig = LlmConfig & { useSDK: true };

export class AiSDK extends BaseAi {
  model: LanguageModel;
  llmConfig: AiSDKConfig;

  constructor(llmConfig: AiSDKConfig) {
    super();
    this.llmConfig = llmConfig;
    this.model = llmConfig.model || getDefaultModel();
  }

  generateChatOptions(chatBody: ChatBody): GenerateTextOptions {
    const messages: ModelMessage[] = chatBody.messages
      .map((msg) => {
        if (msg.role === 'user') {
          const userMessage: UserModelMessage = {
            role: 'user',
            content: msg.content as UserContent,
          };

          return userMessage;
        }
        if (msg.role === 'assistant') {
          let assistantMessage: AssistantModelMessage;
          let content: AssistantContent = msg.content as string;

          if (msg.tool_calls) {
            const toolCallsContent: ToolCallPart[] = msg.tool_calls.map((toolCall) => ({
              type: 'tool-call',
              toolCallId: toolCall.id,
              toolName: toolCall.function.name,
              input: (() => {
                try {
                  return JSON.parse(toolCall.function.arguments);
                } catch (error) {
                  console.error(`Failed to parse tool arguments: ${toolCall.function.arguments}`, error);
                  return {};
                }
              })(),
            }));

            content = toolCallsContent;
          }

          assistantMessage = {
            role: 'assistant',
            content,
          };

          return assistantMessage;
        }
        if (msg.role === 'system') {
          const systemMessage: SystemModelMessage = {
            role: 'system',
            content: msg.content as string,
          };

          return systemMessage;
        }
        if (msg.role === 'tool') {
          const toolResultPart: ToolResultPart = {
            type: 'tool-result',
            toolCallId: msg.tool_call_id,
            toolName: msg.name as string,
            output: {
              type: 'text',
              value: msg.content,
            },
          };
          const toolMessage: ToolModelMessage = {
            role: 'tool',
            content: [toolResultPart],
          };

          return toolMessage;
        }

        return undefined;
      })
      .filter(Boolean) as ModelMessage[];

    const { model, systemPrompt, summarySystemPrompt, url, useSDK, apiKey, ...rest } = this.llmConfig;

    if (systemPrompt) {
      messages.unshift({ role: 'system', content: systemPrompt });
    }

    const chatOptions: GenerateTextOptions = { messages, ...rest };

    if (chatBody.tools?.length) {
      const tools: ToolSet = chatBody.tools.reduce((pre, cur) => {
        return {
          ...pre,
          [cur.function.name]: tool({
            description: cur.function.description,
            inputSchema: jsonSchemaToZod(cur.function.parameters),
          }),
        };
      }, {});

      chatOptions.tools = tools;
      chatOptions.toolChoice = 'auto';
    }

    return chatOptions;
  }

  async chat(chatBody: ChatBody): Promise<ChatCompleteResponse | Error> {
    try {
      const chatOptions = this.generateChatOptions(chatBody);
      const result: GenerateTextResult<ToolSet, unknown> = await generateText({
        model: this.model,
        ...chatOptions,
      });

      const response: ChatCompleteResponse = transformChatResult(result, this.llmConfig.model);

      return response;
    } catch (error) {
      console.error(error);
      return new Error(error instanceof Error ? error.message : 'An unexpected error occurred during chat');
    }
  }

  async chatStream(chatBody: ChatBody): Promise<globalThis.ReadableStream<Uint8Array>> {
    try {
      const chatOptions: StreamTextOptions = this.generateChatOptions(chatBody);
      const result: StreamTextResult<ToolSet, unknown> = streamText({
        model: this.model,
        ...chatOptions,
      });
      const iterator = this.openaiChunkGenerator(result);

      return new ReadableStream<Uint8Array>({
        async pull(controller) {
          try {
            const { value, done } = await iterator.next();
            if (done) {
              controller.close();
            } else {
              controller.enqueue(value);
            }
          } catch (err) {
            const encoder = new TextEncoder();
            const errorMessage = err instanceof Error ? err.message : 'Stream failed';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        },
      });
    } catch (error) {
      console.error(error);

      const errorMessage = error instanceof Error ? error.message : 'Stream failed';

      return new ReadableStream<Uint8Array>({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
    }
  }

  async *openaiChunkGenerator(result: StreamTextResult<ToolSet, unknown>): AsyncGenerator<Uint8Array> {
    const encoder = new TextEncoder();
    for await (const chunk of result.fullStream) {
      const data = toOpenAIChunk(chunk, this.model);

      yield encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
    }
    yield encoder.encode('data: [DONE]\n\n');
  }
}
