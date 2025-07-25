import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import { AgentStrategy, Role } from './type.js';
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
} from './type.js';
import { type BaseAi, getAiInstance } from './ai/index.js';

export function isCustomTransportMcpServer(
  serverConfig: McpServer | CustomTransportMcpServer,
): serverConfig is CustomTransportMcpServer {
  return !!serverConfig.customTransport;
}
const DEFAULT_AGENT_STRATEGY = AgentStrategy.FUNCTION_CALLING;
export abstract class McpClientChat {
  protected options: MCPClientOptions;
  protected iterationSteps: number;
  protected clientsMap: Map<string, Client> = new Map<string, Client>();
  protected toolClientMap: Map<string, Client> = new Map<string, Client>();
  protected messages: Message[] = [];
  protected transformStream = new TransformStream();
  protected chatOptions?: IChatOptions;
  protected aiInstance: BaseAi;

  constructor(options: MCPClientOptions) {
    this.options = {
      ...options,
      agentStrategy: options.agentStrategy ?? DEFAULT_AGENT_STRATEGY,
      llmConfig: {
        ...options.llmConfig,
        streamSwitch: options.llmConfig.streamSwitch ?? true,
      },
    };
    this.iterationSteps = options.maxIterationSteps || 1;
    this.aiInstance = getAiInstance(options.llmConfig);
  }

  async init(): Promise<void> {
    const { mcpServers = {} } = this.options.mcpServersConfig;

    for (const [serverName, serverConfig] of Object.entries(mcpServers)) {
      const client = await this.initClients(serverName, serverConfig as McpServer);

      this.clientsMap.set(serverName, client);
    }
  }

  protected async initClients(serverName: string, serverConfig: McpServer | CustomTransportMcpServer): Promise<Client> {
    const client = new Client({
      name: serverName,
      version: '1.0.0',
    });

    if (isCustomTransportMcpServer(serverConfig)) {
      let clientTransport;
      if (typeof serverConfig.customTransport === 'function') {
        clientTransport = serverConfig.customTransport(serverConfig);
      } else {
        clientTransport = serverConfig.customTransport;
      }
      await client.connect(clientTransport);
      return client;
    }

    const { url } = serverConfig;
    const baseUrl = new URL(url);

    try {
      const transport = new StreamableHTTPClientTransport(baseUrl, {
        requestInit: {
          headers: serverConfig.headers,
        },
      });
      await client.connect(transport);
    } catch (_error) {
      const sseTransport = new SSEClientTransport(baseUrl, {
        requestInit: {
          headers: serverConfig.headers,
        },
      });

      await client.connect(sseTransport);
    }

    return client;
  }

  protected async fetchToolsList(): Promise<AvailableTool[]> {
    const availableTools = [];
    const toolClientMap = new Map();

    for (const [, client] of this.clientsMap) {
      const tools = (await client.listTools()).tools as unknown as Tool[];
      const openaiTools = tools.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.name as string,
          description: tool.description as string,
          parameters: {
            type: 'object' as const,
            properties: tool.inputSchema.properties as Record<string, unknown>,
            required: tool.inputSchema.required as string[],
          },
        },
      }));

      availableTools.push(...openaiTools);

      tools.forEach((tool) => {
        toolClientMap.set(tool.name, client);
      });
    }

    this.toolClientMap = toolClientMap;

    return availableTools;
  }

  protected organizePromptMessages(message: Message): void {
    this.messages.push(message);
  }

  protected clearPromptMessages(): void {
    this.messages = [];
  }

  async chat(
    queryOrMessages: string | Array<Message>,
    chatOptions?: IChatOptions,
  ): Promise<globalThis.ReadableStream | Error> {
    this.chatOptions = chatOptions;

    let systemPrompt: string;

    try {
      systemPrompt = await this.initSystemPromptMessages();
    } catch (error) {
      console.error('Failed to initialize system prompt:', error);
      systemPrompt = this.options.llmConfig.systemPrompt ?? '';
    }

    this.organizePromptMessages({
      role: Role.SYSTEM,
      content: systemPrompt,
    });

    if (typeof queryOrMessages === 'string') {
      this.organizePromptMessages({
        role: Role.USER,
        content: queryOrMessages,
      });
    } else {
      this.messages.push(...queryOrMessages);
    }

    this.iterationSteps = this.options.maxIterationSteps || 1;
    this.chatIteration().catch((error) => {
      console.error('Chat failed:', error);
      this.transformStream.writable.abort(error);
    });

    return this.transformStream.readable;
  }

  protected async chatIteration(): Promise<void> {
    try {
      while (this.iterationSteps > 0) {
        let response: ChatCompleteResponse | Error;
        if (this.options.llmConfig.streamSwitch) {
          const streamResponses: ReadableStream = await this.queryChatCompleteStreaming();
          response = await this.generateStreamingResponses(streamResponses);
        } else {
          response = await this.queryChatComplete();
        }

        if (response instanceof Error) {
          this.organizePromptMessages({
            role: Role.ASSISTANT,
            content: response.message,
          });
          this.iterationSteps = 0;

          continue;
        }

        if (response.choices?.[0]?.error) {
          this.organizePromptMessages({
            role: Role.ASSISTANT,
            content: response.choices[0].error.message,
          });
          this.iterationSteps = 0;

          continue;
        }

        const [tool_calls, finalAnswer] = await this.organizeToolCalls(response as ChatCompleteResponse);

        // 工具调用
        if (tool_calls.length) {
          try {
            // 首先添加包含 tool_calls 的 assistant 消息
            this.organizePromptMessages({
              role: Role.ASSISTANT,
              content: '', // assistant 消息内容可以为空，但必须包含 tool_calls
              tool_calls: tool_calls,
            });

            const { messages } = await this.callTools(tool_calls);

            messages.forEach((m) => this.organizePromptMessages(m));

            this.iterationSteps--;
          } catch (_error) {
            this.organizePromptMessages({
              role: Role.ASSISTANT,
              content: 'Tool call failed, retrying...',
            });

            this.iterationSteps--;
          }
        } else {
          this.organizePromptMessages({
            role: Role.ASSISTANT,
            content: finalAnswer,
          });

          this.iterationSteps = 0;
        }
      }

      const summaryPrompt = this.options.llmConfig.summarySystemPrompt || 'Please provide a brief summary.';

      this.organizePromptMessages({ role: Role.USER, content: summaryPrompt });

      const result = await this.queryChatCompleteStreaming();
      result.pipeTo(this.transformStream.writable);

      // TODO: Implement context memory feature, for now clear after each request
      this.clearPromptMessages();
    } catch (error) {
      console.error('Chat iteration failed:', error);
      throw error;
    }
  }

  protected async callTools(toolCalls: ToolCall[]): Promise<{ results: ToolResults; messages: Message[] }> {
    const results: ToolResults = [];
    const messages: Message[] = [];

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      const client = this.toolClientMap.get(toolName);

      if (!client) {
        throw new Error(`Tool "${toolName}" is not registered.`);
      }

      try {
        let toolArgs = {};

        try {
          toolArgs =
            typeof toolCall.function.arguments === 'string'
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments;
        } catch (_error) {
          console.error(`Failed to parse tool arguments for ${toolName}:`, _error);

          toolArgs = {};
        }

        if (this.chatOptions?.toolCallResponse) {
          await this.writeMessageDelta(`Calling tool : ${toolName}` + '\n\n', 'assistant', {
            toolCall,
          });
        }

        const callToolResult = (await client
          .callTool({
            name: toolName,
            arguments: toolArgs,
          })
          .catch(async (error) => {
            if (this.chatOptions?.toolCallResponse) {
              await this.writeMessageDelta('Tool call result: failed \n\n', 'assistant', {
                toolCall,
                callToolResult: {
                  isError: true,
                  error: error instanceof Error ? error.message : String(error),
                },
              });
            }
            throw error;
          })) as CallToolResult;
        const callToolContent = this.getToolCallContent(callToolResult);

        const message: Message = {
          name: toolName,
          role: Role.TOOL,
          tool_call_id: toolCall.id,
          content: `Tool "${toolName}" executed successfully: ${callToolContent}`,
        };
        const result = {
          call: toolName,
          result: callToolResult,
        };

        if (this.chatOptions?.toolCallResponse) {
          await this.writeMessageDelta('Tool call result: ' + JSON.stringify(callToolContent) + '\n\n', 'assistant', {
            toolCall,
            callToolResult,
          });
        }

        messages.push(message);
        results.push(result);
      } catch (error) {
        if (this.chatOptions?.toolCallResponse) {
          await this.writeMessageDelta('Tool call failed: ' + (error as Error).message);
        }

        const message: Message = {
          role: Role.TOOL,
          tool_call_id: toolCall.id,
          content: `Tool "${toolName}" execution failed. Please check the parameters or try again.`,
        };

        const callToolResult: CallToolResult = {
          content: [{ type: 'text', text: 'Tool call failed!' }],
          isError: true,
        };

        const result = {
          call: toolName,
          result: callToolResult,
        };

        messages.push(message);
        results.push(result);
      }
    }

    return { results, messages };
  }

  protected getToolCallContent(toolCallResult: CallToolResult): string {
    let str = '';

    if (toolCallResult.content?.length) {
      toolCallResult.content.forEach((item) => {
        switch (item.type) {
          case 'text':
            str += item.text;
            break;
          case 'image':
          case 'audio':
          case 'resource':
            str += item.data;
            break;
        }
      });
    }

    return str;
  }

  protected mergeStreamingToolCalls(result: ToolCall[], tool_calls: ToolCall[]): void {
    try {
      tool_calls.forEach((toolCall: ToolCall) => {
        if (!toolCall.id) {
          // 修复：确保 result.at(-1) 存在且 function/arguments 字段存在
          const last = result.at(-1);
          if (
            last &&
            last.function &&
            typeof last.function.arguments === 'string' &&
            typeof toolCall.function?.arguments === 'string'
          ) {
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

  protected mergeStreamingResponses(responses: ChatCompleteResponse[]): ChatCompleteResponse {
    try {
      const toolCalls: ToolCall[] = [];
      const isStream = 'delta' in responses[0].choices[0];
      const mergedContent = responses
        .flatMap((r) => r.choices)
        .map((choice) => {
          if ('message' in choice) {
            if (choice.message.tool_calls?.length) {
              this.mergeStreamingToolCalls(toolCalls, choice.message.tool_calls);
            }

            return choice.message?.content ?? '';
          }

          if ('delta' in choice) {
            if (choice.delta.tool_calls?.length) {
              this.mergeStreamingToolCalls(toolCalls, choice.delta.tool_calls);
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

      // 返回聚合后的 ChatCompleteResponse
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

  protected async generateStreamingResponses(
    stream: globalThis.ReadableStream<ChatCompleteResponse>,
  ): Promise<ChatCompleteResponse> {
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
            } catch (_e) {
              // 不是合法JSON可忽略或记录
            }
          }
        }
      }

      return this.mergeStreamingResponses(result);
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

  protected async queryChatComplete(): Promise<ChatCompleteResponse | Error> {
    const chatBody = await this.getChatBody();

    try {
      const response = await this.aiInstance.chat(chatBody);

      return response;
    } catch (error) {
      console.error('Error calling chat/complete:', error);

      return error as Error;
    }
  }

  protected async queryChatCompleteStreaming(): Promise<globalThis.ReadableStream> {
    const chatBody = await this.getChatBody();

    try {
      const response = await this.aiInstance.chatStream(chatBody);

      return response;
    } catch (error) {
      console.error('Error calling chat/complete:', error);

      throw new Error(`Streaming chat API call failed: ${String(error)}`);
    }
  }

  protected async writeMessageDelta(
    messageDeltaContent: string,
    role: string = 'assistant',
    extra?: any,
  ): Promise<void> {
    const writer = this.transformStream.writable.getWriter();

    try {
      await writer.ready;
      const messageDelta = {
        choices: [
          {
            delta: {
              role,
              content: messageDeltaContent,
              extra,
            },
          },
        ],
      };
      await writer.write(new TextEncoder().encode('data: ' + JSON.stringify(messageDelta) + '\n\n'));
    } finally {
      writer.releaseLock();
    }
  }

  protected abstract getChatBody(): Promise<ChatBody>;

  protected abstract organizeToolCalls(response: ChatCompleteResponse): Promise<[ToolCall[], string]>;

  protected abstract initSystemPromptMessages(): Promise<string>;
}
