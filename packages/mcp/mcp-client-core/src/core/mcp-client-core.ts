import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { MCPClientOptions, ChatBody, CallToolsParams, ToolResults, McpServer } from './mcp-client-core.type.js';

export class McpClient {
  private options: MCPClientOptions;
  private iterationSteps;
  private clientsMap: Map<string, Client> = new Map();
  private toolClientMap: Map<string, Client> = new Map();

  constructor(options: MCPClientOptions) {
    this.options = options;
    this.iterationSteps = options.maxIterationSteps || 1;
  }

  async init() {
    const { mcpServers = {} } = this.options.mcpServersConfig;

    for (const [serverName, serverConfig] of Object.entries(mcpServers)) {
      const client = await this.initClients(serverName, serverConfig as McpServer);
      this.clientsMap.set(serverName, client);
    }
  }

  private async initClients(serverName: string, serverConfig: McpServer) {
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

  private async fetchToolsList() {
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

  async chat(query: string) {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: query,
      },
    ];
    const finalTextList: string[] = [];
    this.iterationSteps = this.options.maxIterationSteps || 1;

    try {
      const availableTools = await this.fetchToolsList();
      const toolsCallResults: ToolResults = [];

      while (this.iterationSteps > 0) {
        const response = await this.query({
          messages: [
            {
              role: 'system',
              content: this.options.llmConfig.systemPrompt,
            },
            ...messages,
          ],
          tools: this.iterationSteps > 1 ? availableTools : [],
        });
        const message = response?.choices?.[0]?.message;

        messages.push(message);

        // 工具调用
        if (message?.tool_calls) {
          try {
            const { toolResults, toolCallMessages } = await this.callTools({
              toolCalls: message?.tool_calls,
              messages,
            });

            toolsCallResults.push(...toolResults);
            messages.push(...toolCallMessages);
            this.iterationSteps--;
          } catch (error) {
            throw error;
          }
        } else {
          finalTextList.push(response?.choices?.[0]?.message?.content || '');

          this.iterationSteps = 0;
        }
      }

      return {
        text: finalTextList.join('\n'),
        toolResults: toolsCallResults,
      };
    } catch (error) {
      return {
        text: `调用工具失败：${error}`,
      };
    }
  }

  async callTools({ toolCalls, messages }: CallToolsParams) {
    try {
      const toolResults: ToolResults = [];
      const toolCallMessages = [];

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
        const client = this.toolClientMap.get(toolName);

        if (!client) {
          continue;
        }

        // 调用工具
        const response = await client.callTool({
          name: toolName,
          arguments: toolArgs,
        });
        const message: ChatCompletionMessageParam = {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(response.content),
        };

        toolCallMessages.push(message);

        toolResults.push({
          call: toolName,
          result: response,
        });
      }
      return { toolResults, toolCallMessages };
    } catch (error) {
      console.error('调用工具时发生错误:', error);

      throw error;
    }
  }

  /**
   * 调用 AI 的 chat。
   * @param body
   * @returns
   */
  async query(body: ChatBody) {
    const { apiKey, model } = this.options.llmConfig;

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, ...body }),
      });

      return res.json();
    } catch (error) {
      console.error('调用 AI chat 接口时发生错误:', error);

      return {
        error: '调用 AI chat 接口失败',
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
