import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import { AgentStrategy, Role } from './type.js';
import { logger } from './logger/index.js';

import type {
  AvailableTool,
  ChatCompleteRequest,
  ChatCompleteResponse,
  CustomTransportMcpServer,
  IChatOptions,
  MCPClientOptions,
  McpServer,
  Message,
  NonChatChoice,
  NonStreamingChoice,
  StreamingChoice,
  ToolCall,
  ToolResults,
} from './type.js';

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
  protected abortController: AbortController | null = null;

  constructor(options: MCPClientOptions) {
    this.options = {
      ...options,
      agentStrategy: options.agentStrategy ?? DEFAULT_AGENT_STRATEGY,
      streamSwitch: options.streamSwitch ?? true,
    };
    this.iterationSteps = options.maxIterationSteps || 1;
  }

  protected abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async init(): Promise<void> {
    const { mcpServers = {} } = this.options.mcpServersConfig;

    for (const [serverName, serverConfig] of Object.entries(mcpServers)) {
      const client = await this.initClients(serverName, serverConfig as McpServer);

      if (!client) {
        continue;
      }

      this.clientsMap.set(serverName, client);
    }

    logger.info('Successfully connected to mcp-client-agent.');
  }

  protected async initClients(
    serverName: string,
    serverConfig: McpServer | CustomTransportMcpServer,
  ): Promise<Client | null> {
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

    let baseUrl: URL;

    try {
      const { url } = serverConfig;
      baseUrl = new URL(url);
    } catch (error) {
      logger.error(`Init ${serverName} failed: ${error}`);

      return null;
    }

    try {
      const transport = new StreamableHTTPClientTransport(baseUrl, {
        requestInit: {
          headers: serverConfig.headers,
        },
      });
      await client.connect(transport);
    } catch (_error) {
      try {
        const sseTransport = new SSEClientTransport(baseUrl, {
          requestInit: {
            headers: serverConfig.headers,
          },
        });

        await client.connect(sseTransport);
      } catch (error) {
        logger.error(`Init ${serverName} failed: ${error}`);

        return null;
      }
    }

    logger.info(`Successfully connected to MCP server: ${serverName}`);

    return client;
  }

  protected async fetchToolsList(): Promise<AvailableTool[]> {
    const availableTools = [];
    const toolClientMap = new Map();

    for (const [, client] of this.clientsMap) {
      try {
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
      } catch (error) {
        logger.error('Failed to fetch tools from client:', error);
      }
    }

    this.toolClientMap = toolClientMap;
    logger.info('Successfully fetched tools list:', JSON.stringify(availableTools.map((t) => t.function.name)));

    return availableTools;
  }

  protected organizePromptMessages(message: Message): void {
    this.messages.push(message);
  }

  protected clearPromptMessages(): void {
    this.messages = [];
  }

  protected async chat(
    queryOrMessages: string | Array<Message>,
    chatOptions?: IChatOptions,
  ): Promise<ReadableStream | Error> {
    this.chatOptions = chatOptions;

    let systemPrompt: string;

    try {
      systemPrompt = await this.initSystemPromptMessages();
    } catch (error) {
      logger.error('Failed to initialize system prompt:', error);
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
      logger.error('Chat failed:', error);
      this.transformStream.writable.abort(error);
    });

    return this.transformStream.readable;
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
      logger.error(`mergeStreamingToolCalls failed: ${error}`);
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

      return result;
    } catch (error) {
      logger.error(`mergeStreamingResponses failed: ${error}`);

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

  protected async generateStreamingResponses(stream: ReadableStream): Promise<ChatCompleteResponse> {
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

              if (obj.choices[0].delta.content) {
                await this.writeMessageDelta(obj.choices[0].delta.content);
              }
            } catch (_e) {
              // 不是合法JSON可忽略或记录
            }
          }
        }
      }
      return this.mergeStreamingResponses(result);
    } catch (error) {
      logger.error(error);

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

  protected async chatIteration(): Promise<void> {
    try {
      this.abortController = new AbortController();
      const signal = this.abortController.signal;

      while (this.iterationSteps > 0) {
        if (signal.aborted) {
          logger.info('🛑 Chat iteration aborted');
          break;
        }

        let response: ChatCompleteResponse | Error;

        if (this.options.streamSwitch) {
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
          logger.error(`queryChatComplete failed: ${response}`);

          continue;
        }

        if (response.choices?.[0]?.error) {
          this.organizePromptMessages({
            role: Role.ASSISTANT,
            content: response.choices[0].error.message,
          });
          this.iterationSteps = 0;
          logger.error(`queryChatComplete failed: ${response.choices[0].error.message}`);

          continue;
        }

        const { toolCalls, thought, finalAnswer } = await this.organizeToolCalls(response as ChatCompleteResponse);

        if (!this.options.streamSwitch && thought) {
          await this.writeMessageDelta(thought);
        }

        // 工具调用
        if (toolCalls.length) {
          try {
            if (signal.aborted) {
              logger.info('🛑 Tool calls aborted');
              break;
            }
            
            // 首先添加包含 tool_calls 的 assistant 消息
            this.organizePromptMessages({
              role: Role.ASSISTANT,
              content: '', // assistant 消息内容可以为空，但必须包含 tool_calls
              tool_calls: toolCalls,
            });

            const { messages } = await this.callTools(toolCalls);

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

      if (signal.aborted) {
        logger.info('🛑 Skipping summary due to abort');
        return;
      }

      const summaryPrompt = this.options.llmConfig.summarySystemPrompt || 'Please provide a brief summary.';

      this.organizePromptMessages({ role: Role.USER, content: summaryPrompt });

      const result = await this.queryChatCompleteStreaming();

      result.pipeTo(this.transformStream.writable);
    } catch (error) {
      logger.error('Chat iteration failed:', error);
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  protected async callTools(toolCalls: ToolCall[]): Promise<{ results: ToolResults; messages: Message[] }> {
    try {
      const toolResults: ToolResults = [];
      const toolCallMessages: Message[] = [];

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const client = this.toolClientMap.get(toolName);

        if (!client) {
          toolCallMessages.push({
            role: Role.TOOL,
            tool_call_id: toolCall.id,
            content: `Tool "${toolName}" not found.`,
          });
          toolResults.push({
            call: toolName,
            result: {
              content: [],
              isError: true,
              error: `Tool "${toolName}" not found.`,
            },
          });
          logger.error(`Tool "${toolName}" not found.`);

          continue;
        }

        let toolArgs = {};

        try {
          toolArgs =
            typeof toolCall.function.arguments === 'string'
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments;
        } catch (error) {
          logger.error(`Failed to parse tool arguments for ${toolName}:`, error);
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
              await this.writeMessageDelta(`[${toolCall.function.name}] Tool call result: failed. \n\n`, 'assistant', {
                toolCall,
                callToolResult: {
                  isError: true,
                  error: error instanceof Error ? error.message : JSON.stringify(error),
                },
              });
            }
            logger.error(`Failed to call tool "${toolName}":`, error);

            return {
              isError: true,
              error: error instanceof Error ? error.message : JSON.stringify(error),
            };
          })) as CallToolResult;
        const callToolContent = this.getToolCallContent(callToolResult);
        const message: Message = {
          role: Role.TOOL,
          tool_call_id: toolCall.id,
          content: callToolContent,
        };

        if (this.chatOptions?.toolCallResponse) {
          await this.writeMessageDelta('Tool call result: ' + JSON.stringify(callToolContent) + '\n\n', 'assistant', {
            toolCall,
            callToolResult,
          });
        }

        toolCallMessages.push(message);
        toolResults.push({
          call: toolName,
          result: callToolResult,
        });

        logger.info(`Successfully called tool "${toolName}". Result:`, callToolContent);
      }

      return { results: toolResults, messages: toolCallMessages };
    } catch (error) {
      logger.error('Failed to call tools:', error);

      return { results: [], messages: [{ role: Role.ASSISTANT, content: 'call tools failed!' }] };
    }
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

  protected async queryChatComplete(): Promise<ChatCompleteResponse | Error> {
    const { url, apiKey } = this.options.llmConfig;
    const chatBody = await this.getChatBody();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stream: true, ...chatBody }),
        signal: this.abortController?.signal,
      });
      if (!response.ok) {
        return new Error(`Failed to fetch ${url}: ${response.status}:${await response.text()}`);
      }

      return (await response.json()) as ChatCompleteResponse;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.info('🛑 Chat API request aborted');
        return new Error('Request was aborted');
      }

      logger.error('Error calling chat/complete:', error);

      if (error instanceof Error) {
        return error;
      } else {
        return new Error(String(error));
      }
    }
  }

  protected generateErrorStream(errorMessage: string) {
    const errorResponse: ChatCompleteResponse = {
      id: `chat-error-${Date.now()}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: this.options.llmConfig.model as string,
      choices: [
        {
          finish_reason: 'error',
          native_finish_reason: 'error',
          delta: {
            role: Role.ASSISTANT,
            content: errorMessage,
          },
        },
      ],
    };
    const data = `data: ${JSON.stringify(errorResponse)}\n`;

    return new ReadableStream({
      start(controller) {
        controller.enqueue(data);
        controller.enqueue('data: [DONE]\n');
        controller.close();
      },
    });
  }

  protected async queryChatCompleteStreaming(): Promise<ReadableStream> {
    const { url, apiKey } = this.options.llmConfig;
    const chatBody = await this.getChatBody();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stream: true, ...chatBody }),
        signal: this.abortController?.signal,
      });

      if (!response.body) {
        return this.generateErrorStream('Response body is empty!');
      }

      if (!response.ok) {
        // 获取详细的错误信息
        const errorText = await response.text();
        const errorMessage = `Failed to call chat API! ${errorText}`;
        logger.error('Failed to call chat API:', errorMessage);
        return this.generateErrorStream(errorMessage);
      }

      return response.body;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error('🛑 Chat API request aborted');
        return this.generateErrorStream('Request was aborted by user');
      }

      logger.error('Failed to call streaming chat/complete:', error);
      return this.generateErrorStream(`Failed to call chat API! ${error}`);
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

  protected abstract getChatBody(): Promise<ChatCompleteRequest>;

  protected abstract organizeToolCalls(
    response: ChatCompleteResponse,
  ): Promise<{ toolCalls: ToolCall[]; finalAnswer: string; thought?: string }>;

  protected abstract initSystemPromptMessages(): Promise<string>;
}
