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
  ToolCall,
  ToolResults,
} from './type.js';

export function isCustomTransportMcpServer(serverConfig: McpServer | CustomTransportMcpServer): serverConfig is CustomTransportMcpServer {
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

  constructor(options: MCPClientOptions) {
    this.options = {
      ...options,
      agentStrategy: options.agentStrategy ?? DEFAULT_AGENT_STRATEGY,
    };
    this.iterationSteps = options.maxIterationSteps || 1;
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
        clientTransport = serverConfig.customTransport
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
      const toolsCallResults: ToolResults = [];

      while (this.iterationSteps > 0) {
        const response: ChatCompleteResponse | Error = await this.queryChatComplete();

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
            const { toolResults, toolCallMessages } = await this.callTools(tool_calls);

            toolsCallResults.push(...toolResults);
            toolCallMessages.forEach((m) => this.organizePromptMessages(m));

            this.iterationSteps--;
          } catch (_error) {
            this.organizePromptMessages({
              role: Role.ASSISTANT,
              content: 'call tools failed!',
            });

            this.iterationSteps = 0;
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
    } catch (error) {
      console.error('Chat iteration failed:', error);
      throw error;
    }
  }

  protected async callTools(toolCalls: ToolCall[]): Promise<{ toolResults: ToolResults; toolCallMessages: Message[] }> {
    try {
      const toolResults: ToolResults = [];
      const toolCallMessages: Message[] = [];

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const client = this.toolClientMap.get(toolName);

        if (!client) {
          continue;
        }

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

        const callToolResult = (await client.callTool({
          name: toolName,
          arguments: toolArgs,
        }).catch(async error => {
          if (this.chatOptions?.toolCallResponse) {
            await this.writeMessageDelta(`[${toolCall.function.name}] Tool call result: failed \n\n`, 'assistant', {
              toolCall,
              callToolResult: {
                isError: true,
                error: error instanceof Error ? error.message : JSON.stringify(error)
              },
            });
          }
          return {
            isError: true,
            error: error instanceof Error ? error.message : JSON.stringify(error)
          }
        })) as CallToolResult;
        const callToolContent = this.getToolCallMessage(callToolResult);
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
      }

      return { toolResults, toolCallMessages };
    } catch (error) {
      console.error('Error calling tools:', error);

      return { toolResults: [], toolCallMessages: [{ role: Role.ASSISTANT, content: 'call tools failed!' }] };
    }
  }

  protected getToolCallMessage(toolCallResult: CallToolResult): string {
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

  protected async queryChatComplete(): Promise<ChatCompleteResponse> {
    const { url, apiKey } = this.options.llmConfig;
    const chatBody = await this.getChatBody();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }

      return (await response.json()) as ChatCompleteResponse;
    } catch (error) {
      console.error('Error calling chat/complete:', error);

      throw error;
    }
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
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      return response.body;
    } catch (error) {
      console.error('Error calling streaming chat/complete:', error);

      throw new Error(`Streaming chat API call failed: ${String(error)}`);
    } finally {
      // TODO: Implement context memory feature, for now clear after each request
      this.clearPromptMessages();
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
