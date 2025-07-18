import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { CallToolResult, ChatCompletionTool } from '@modelcontextprotocol/sdk/types.js';
import { AgentStrategy, Role } from './type.js';
import { AiRESTInstance } from './ai-instance/ai-rest-instance/index.js';
import { AiSDKInstance } from './ai-instance/ai-sdk-instance/index.js';

import type {
  AvailableTool,
  ChatBody,
  ChatCompleteResponse,
  ChatCompletionMessageParam,
  CustomTransportMcpServer,
  IChatOptions,
  MCPClientOptions,
  McpServer,
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
  protected messages: ChatCompletionMessageParam[] = [];
  protected transformStream = new TransformStream();
  protected chatOptions?: IChatOptions;
  protected aiInstance?: AiSDKInstance | AiRESTInstance;

  constructor(options: MCPClientOptions) {
    this.options = {
      ...options,
      agentStrategy: options.agentStrategy ?? DEFAULT_AGENT_STRATEGY,
      useSDK: options.useSDK ?? true,
    };
    this.iterationSteps = options.maxIterationSteps || 1;

    this.aiInstance = this.getAiInstance();
  }

  getAiInstance() {
    if (this.options.useSDK) {
      return new AiSDKInstance(this.options.llmConfig);
    }

    return new AiRESTInstance(this.options.llmConfig)
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
      const tools = (await client.listTools()).tools as unknown as ChatCompletionTool[];
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

  protected organizePromptMessages(message: ChatCompletionMessageParam): void {
    this.messages.push(message);
  }

  protected clearPromptMessages(): void {
    this.messages = [];
  }

  async chat(queryOrMessages: string | Array<ChatCompletionMessageParam>, chatOptions?: IChatOptions): Promise<ReadableStream | Error> {
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
    } catch (error) {
      console.error('Chat iteration failed:', error);
      throw error;
    }
  }

  protected async callTools(toolCalls: ToolCall[]): Promise<{ results: ToolResults; messages: ChatCompletionMessageParam[] }> {
    const results: ToolResults = [];
    const messages: ChatCompletionMessageParam[] = [];

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

        const callToolResult = (await client.callTool({
          name: toolName,
          arguments: toolArgs,
        })) as CallToolResult;
        const callToolContent = this.getToolCallContent(callToolResult);
        const message: ChatCompletionMessageParam = {
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

        const message: ChatCompletionMessageParam = {
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

  protected async queryChatComplete(): Promise<ChatCompleteResponse | Error> {
    const { baseURL, apiKey } = this.options.llmConfig;
    const chatBody = await this.getChatBody();

    try {
      const response = await fetch(baseURL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatBody),
      });
      if (!response.ok) {
        return new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }

      return (await response.json()) as ChatCompleteResponse;
    } catch (error) {
      console.error('Error calling chat/complete:', error);

      return error as Error;
    }
  }

  protected async queryChatCompleteStreaming(): Promise<ReadableStream> {
    const { baseURL, apiKey } = this.options.llmConfig;
    const chatBody = await this.getChatBody();

    try {
      const response = await fetch(baseURL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stream: true, ...chatBody }),
      });

      if (!response.ok) {
        // 获取详细的错误信息
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}\nError details: ${errorText}`);
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
