import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import dotenv from 'dotenv';

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type {
  MCPClientOptions,
  ChatBody,
  CallToolsParams,
  AvailableTool,
  ToolResults,
  McpServer,
  McpServersConfig,
} from './mcp-client-core.type.js';

dotenv.config();

export class McpClient {
  private llmConfig;
  private mcpServersConfig: McpServersConfig;
  private iterationSteps = 1;
  private clientsMap: Map<string, Client> = new Map();
  private toolsMap: Map<string, AvailableTool[]> = new Map();
  private availableTools: AvailableTool[] = [];
  private toolClientMap: Map<string, Client> = new Map();

  constructor(options: MCPClientOptions) {
    const { llmConfig, mcpServersConfig, maxIterationSteps } = options;

    this.llmConfig = llmConfig;
    this.iterationSteps = maxIterationSteps || 1;
    this.mcpServersConfig = mcpServersConfig;
  }

  async init() {
    const { mcpServers = {} } = this.mcpServersConfig;

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

      this.toolsMap.set(serverName, openaiTools);
      this.availableTools.push(...openaiTools);

      tools.forEach((tool) => {
        this.toolClientMap.set(tool.name, client);
      });
    }
  }

  async chat(query: string) {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: query,
      },
    ];
    const finalTextList: string[] = [];

    try {
      await this.fetchToolsList();
      const toolsCallResults: ToolResults = [];

      while (this.iterationSteps > 0) {
        const response = await this.query({
          messages: [
            {
              role: 'system',
              content: this.llmConfig.systemPrompt,
            },
            ...messages,
          ],
          tools: this.iterationSteps > 1 ? this.availableTools : [],
        });
        const message = response?.choices?.[0]?.message;

        messages.push(message);

        // 工具调用
        if (message?.tool_calls) {
          const { toolResults } = await this.callTools({
            toolCalls: message?.tool_calls,
            messages,
          });

          toolsCallResults.push(...toolResults);

          this.iterationSteps--;
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
      console.error(error);
      // TODO: 调用失败返回的文本
      return {
        text: '调用失败',
      };
    }
  }

  async callTools({ toolCalls, messages }: CallToolsParams) {
    const toolResults: ToolResults = [];

    if (!toolCalls.length) {
      return {
        toolResults,
      };
    }

    try {
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
        const chatMessage: ChatCompletionMessageParam = {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(response.content),
        };

        toolResults.push({
          call: toolName,
          result: response,
        });
        messages.push(chatMessage);
      }
    } catch (error) {
      console.error(error);
    } finally {
      return { toolResults };
    }
  }

  /**
   * 调用 AI 的 chat。
   * @param body
   * @returns
   */
  async query(body: ChatBody) {
    const { apiKey, model } = this.llmConfig;

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
      throw error;
    }
  }
}
