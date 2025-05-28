import { Readable } from 'stream';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type {
  MCPClientOptions,
  ChatBody,
  CallToolsParams,
  ToolResults,
  McpServer,
  ChatCompleteResponse,
  NonStreamingChoice,
  ChatCompleteRequest,
  Message,
} from './type.js';

export class McpClientChat {
  protected options: MCPClientOptions;
  protected iterationSteps;
  protected clientsMap: Map<string, Client> = new Map();
  protected toolClientMap: Map<string, Client> = new Map();
  protected messages: Message[];

  constructor(options: MCPClientOptions) {
    this.options = options;
    this.iterationSteps = options.maxIterationSteps || 1;
    this.messages = [
      {
        role: 'system',
        content: this.options.llmConfig.systemPrompt,
      },
    ];
  }

  async init() {
    const { mcpServers = {} } = this.options.mcpServersConfig;

    for (const [serverName, serverConfig] of Object.entries(mcpServers)) {
      const client = await this.initClients(serverName, serverConfig as McpServer);
      this.clientsMap.set(serverName, client);
    }
  }

  protected async initClients(serverName: string, serverConfig: McpServer) {
    const client = new Client({
      name: serverName,
      version: '1.0.0',
    });
    const { url } = serverConfig;
    const baseUrl = new URL(url);

    try {
      const transport = new StreamableHTTPClientTransport(new URL(baseUrl));

      await client.connect(transport);
    } catch (error) {
      const sseTransport = new SSEClientTransport(baseUrl);

      await client.connect(sseTransport);
    }

    return client;
  }

  protected async fetchToolsList() {
    const availableTools = [];
    const toolClientMap = new Map();

    for (const [serverName, client] of this.clientsMap) {
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

  protected getUserMessages(): Message {
    const userMessage = this.messages.find((m) => m.role === 'user');

    if (userMessage) {
      return userMessage;
    }

    const defaultUserMessage: Message = {
      role: 'user',
      content: [],
    };

    this.messages.push(defaultUserMessage);

    return defaultUserMessage;
  }

  protected organizePromptMessages(message: Message) {
    if (message.role === 'user') {
      const userMessages = this.getUserMessages();

      if (Array.isArray(userMessages.content)) {
        userMessages.content.push({
          type: 'text',
          text: message.content as string,
        });
      } else {
        userMessages.content += message.content;
      }
    } else {
      this.messages.push(message);
    }
  }
  protected clearPromptMessages() {
    this.messages = [];
  }

  async chat(query: string) {
    this.organizePromptMessages({
      role: 'user',
      content: query,
    });
    this.iterationSteps = this.options.maxIterationSteps || 1;

    try {
      const availableTools = await this.fetchToolsList();
      const toolsCallResults: ToolResults = [];

      while (this.iterationSteps > 0) {
        const response: ChatCompleteResponse | Error = await this.queryChatComplete({
          messages: this.messages,
          tools: this.iterationSteps > 1 ? availableTools : [],
        });

        if (response.choices?.[0]?.error) {
          this.organizePromptMessages({
            role: 'assistant',
            content: response.choices[0].error.message,
          });
          this.iterationSteps = 0;

          continue;
        }

        const message = (response.choices[0] as NonStreamingChoice).message;
        const { tool_calls } = message;

        // 工具调用
        if (tool_calls) {
          this.organizePromptMessages({
            role: 'assistant',
            content: JSON.stringify({ tool_calls }),
          });

          try {
            const { toolResults, toolCallMessages } = await this.callTools({
              toolCalls: tool_calls,
            });

            toolsCallResults.push(...toolResults);
            toolCallMessages.forEach((m) => this.organizePromptMessages(m));

            this.iterationSteps--;
          } catch (error) {
            throw error;
          }
        } else {
          this.organizePromptMessages({
            role: 'assistant',
            content: message.content ?? '',
          });

          this.iterationSteps = 0;
        }
      }

      const result = await this.queryChatCompleteStreaming({
        messages: [...this.messages, { role: 'user', content: '用简短的话总结！' }],
      });

      return result;
    } catch (error) {
      return {
        code: 500,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  protected async callTools({ toolCalls }: CallToolsParams) {
    try {
      const toolResults: ToolResults = [];
      const toolCallMessages: Message[] = [];

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
        const client = this.toolClientMap.get(toolName);

        if (!client) {
          continue;
        }

        // 调用工具
        const callToolResult = (await client.callTool({
          name: toolName,
          arguments: toolArgs,
        })) as CallToolResult;
        const callToolContent = this.getToolCallMessage(callToolResult);
        const message: Message = {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: callToolContent,
        };

        toolCallMessages.push(message);
        toolResults.push({
          call: toolName,
          result: callToolResult,
        });
      }

      return { toolResults, toolCallMessages };
    } catch (error) {
      console.error('调用工具时发生错误:', error);

      throw error;
    }
  }

  protected getToolCallMessage(toolCallResult: CallToolResult) {
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

  protected async queryChatComplete(body: ChatBody): Promise<ChatCompleteResponse> {
    const { url, apiKey, model } = this.options.llmConfig;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, ...body }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }

      return (await response.json()) as ChatCompleteResponse;
    } catch (error) {
      console.error('调用 chat/complete 报错：', error);

      throw error;
    }
  }

  protected async queryChatCompleteStreaming(body: ChatBody, stream = true) {
    const { url, apiKey, model } = this.options.llmConfig;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, stream, ...body }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const readableStream = Readable.fromWeb(response.body as any);

      return readableStream;
    } catch (error) {
      console.error('流式调用 chat/complete 报错：', error);

      throw new Error(`流式调用 chat 接口失败： ${String(error)}`);
    } finally {
      // TODO: 待实现上下文记忆功能，此处先每次清理
      this.clearPromptMessages();
    }
  }
}
