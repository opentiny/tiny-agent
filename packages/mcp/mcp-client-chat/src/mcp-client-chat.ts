import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { CallToolResult, Progress, Tool } from '@modelcontextprotocol/sdk/types.js';
import { DEFAULT_REQUEST_TIMEOUT_MSEC } from '@modelcontextprotocol/sdk/shared/protocol.js';
import { AgentStrategy, Role } from './types/index.js';
import { generateStreamingResponses } from './utils/index.js';
import { type BaseAi, getAiInstance } from './ai/index.js';

import type {
  AvailableTool,
  ChatBody,
  ChatCompleteResponse,
  CustomTransportMcpServer,
  IChatOptions,
  MCPClientOptions,
  McpServer,
  Message,
  ToolCall,
  ToolResults,
} from './types/index.js';

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
  protected aiInstance: BaseAi | null = null;

  constructor(options: MCPClientOptions) {
    this.options = {
      ...options,
      agentStrategy: options.agentStrategy ?? DEFAULT_AGENT_STRATEGY,
      streamSwitch: options.llmConfig.streamSwitch ?? true,
    };
    this.iterationSteps = options.maxIterationSteps || 1;
  }

  async init(): Promise<void> {
    this.aiInstance = await getAiInstance(this.options.llmConfig);

    const { mcpServers = {} } = this.options.mcpServersConfig;

    for (const [serverName, serverConfig] of Object.entries(mcpServers)) {
      const client = await this.initClients(serverName, serverConfig as McpServer);

      if (client) {
        this.clientsMap.set(serverName, client);
      }
    }
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

      try {
        await client.connect(clientTransport);
        return client;
      } catch (error) {
        console.error(`Init ${serverName} failed:`, error);
        return null;
      }
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
      try {
        const sseTransport = new SSEClientTransport(baseUrl, {
          requestInit: {
            headers: serverConfig.headers,
          },
        });
        await client.connect(sseTransport);
      } catch (error) {
        console.error(`Failed to connect to ${serverName}:`, error);
        return null;
      }
    }

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
        console.error('Failed to fetch tools from client:', error);
      }
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

  async chat(queryOrMessages: string | Array<Message>, chatOptions?: IChatOptions): Promise<ReadableStream | Error> {
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

        if (this.options.streamSwitch) {
          const streamResponses: ReadableStream = await this.queryChatCompleteStreaming();
          response = await generateStreamingResponses(streamResponses, this.writeMessageDelta.bind(this));
        } else {
          response = await this.queryChatComplete();
        }

        if (response instanceof Error) {
          this.organizePromptMessages({
            role: Role.ASSISTANT,
            content: response.message,
          });
          this.iterationSteps = -1; // 手动结束为-1

          continue;
        }

        if (response.choices?.[0]?.error) {
          this.organizePromptMessages({
            role: Role.ASSISTANT,
            content: response.choices[0].error.message,
          });
          this.iterationSteps = -1; // 手动结束为-1

          continue;
        }

        const { toolCalls, thought, finalAnswer } = await this.organizeToolCalls(response as ChatCompleteResponse);

        if (!this.options.streamSwitch && thought && (toolCalls.length || thought !== finalAnswer)) {
          await this.writeMessageDelta(thought);
        }

        // 工具调用
        if (toolCalls.length) {
          try {
            // 首先添加包含 tool_calls 的 assistant 消息
            this.organizePromptMessages({
              role: Role.ASSISTANT,
              content: '', // assistant 消息内容可以为空，但必须包含 tool_calls
              tool_calls: toolCalls,
            });

            const { messages } = await this.callTools(toolCalls);

            messages.forEach((m) => this.organizePromptMessages(m));

            this.iterationSteps--;
          } catch (error) {
            console.error('Tool call failed:', error);
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

      if (
        this.messages[this.messages.length - 1].role === Role.ASSISTANT &&
        this.messages[this.messages.length - 1].content?.length > 0
      ) {
        if (this.iterationSteps === -1) {
          await this.writeMessageDelta(this.messages[this.messages.length - 1].content as string, 'assistant');
        }

        this.writeMessageEnd();
        return;
      }

      const summaryPrompt = this.options.llmConfig.summarySystemPrompt || 'Please provide a brief summary.';

      this.organizePromptMessages({ role: Role.USER, content: summaryPrompt });

      const result = await this.queryChatCompleteStreaming();

      result.pipeTo(this.transformStream.writable);
    } catch (error) {
      console.error('Chat iteration failed:', error);
      throw error;
    }
  }

  protected async writeMessageEnd() {
    const writer = this.transformStream.writable.getWriter();
    await writer.ready;
    await writer.write(new TextEncoder().encode('data: [DONE]\n\n'));
    await writer.close();
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
          console.error(`Tool "${toolName}" not found.`);

          continue;
        }

        let toolArgs = {};

        try {
          toolArgs =
            typeof toolCall.function.arguments === 'string'
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments;
        } catch (error) {
          console.error(`Failed to parse tool arguments for ${toolName}:`, error);
          toolArgs = {};
        }

        if (this.chatOptions?.toolCallResponse) {
          await this.writeMessageDelta(`Calling tool : ${toolName}` + '\n\n', 'assistant', {
            toolCall,
          });
        }

        const callToolResult = (await client
          .callTool(
            {
              name: toolName,
              arguments: toolArgs,
            },
            undefined,
            {
              onprogress: async (progress: Progress) => this.writeToolCallProgress(toolCall, progress),
              resetTimeoutOnProgress: true,
              maxTotalTimeout: 10 * DEFAULT_REQUEST_TIMEOUT_MSEC,
            },
          )
          .catch(async (error) => {
            if (this.chatOptions?.toolCallResponse) {
              await this.writeMessageDelta(`[${toolCall.function.name}] Tool call result: failed \n\n`, 'assistant', {
                toolCall,
                callToolResult: {
                  isError: true,
                  error: error instanceof Error ? error.message : JSON.stringify(error),
                },
              });
            }
            console.error(`Failed to call tool "${toolName}":`, error);

            return {
              isError: true,
              error: error instanceof Error ? error.message : JSON.stringify(error),
            };
          })) as CallToolResult;
        const callToolContent = this.getToolCallContent(callToolResult);
        const message: Message = {
          role: Role.TOOL,
          tool_call_id: toolCall.id,
          name: toolName,
          content: callToolContent,
        };

        if (this.chatOptions?.toolCallResponse) {
          await this.writeMessageDelta(
            `[${toolCall.function.name}] Tool call result: ${JSON.stringify(callToolContent)}\n\n`,
            'assistant',
            {
              toolCall,
              callToolResult,
            },
          );
        }

        toolCallMessages.push(message);
        toolResults.push({
          call: toolName,
          result: callToolResult,
        });

        console.log(`Successfully called tool "${toolName}". Result:`, callToolContent);
      }

      return { results: toolResults, messages: toolCallMessages };
    } catch (error) {
      console.error('Failed to call tools:', error);

      return {
        results: [],
        messages: [
          {
            role: Role.ASSISTANT,
            content: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
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
    const chatBody = await this.getChatBody();

    try {
      const response = await this.aiInstance.chat(chatBody);

      return response;
    } catch (error) {
      console.error('Error calling chat/complete:', error);

      return error as Error;
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

  protected async writeToolCallProgress(toolCall: ToolCall, progress: Progress) {
    await this.writeMessageDelta(
      `[${toolCall.function.name}] ` +
        ((progress.message as string) || `${progress.progress}${progress.total ? `/${progress.total}` : ''}`) +
        '\n\n',
      'assistant',
      { toolCall, progress },
    );
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

  protected abstract organizeToolCalls(
    response: ChatCompleteResponse,
  ): Promise<{ toolCalls: ToolCall[]; finalAnswer: string; thought?: string }>;

  protected abstract initSystemPromptMessages(): Promise<string>;
}
