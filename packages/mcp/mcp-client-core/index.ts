import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import dotenv from "dotenv";

dotenv.config();

export interface McpServerConfig {
  url: string;
}
export interface MCPClientOptions {
  llmConfig: {
    apiKey: string; // 调用大模型api key
    model: string; // 大模型名称
    systemPrompt: string; // 系统提示词
    iterationCount?: number; // 工具调用最大迭代次数
  };
  mcpServerConfig?: McpServerConfig;
}

interface ChatBody {
  model: string;
  messages: ChatCompletionMessageParam[];
  tools?: {
    type: "function";
    function: {
      name: string;
      description?: string;
      parameters: {
        type: "object";
        properties?: Record<string, unknown>;
        required?: string[];
      };
    };
  }[];
}

export class MCPClient {
  private options: MCPClientOptions;
  private client: Client;
  private tools: Tool[] = [];

  constructor(options: MCPClientOptions) {
    this.options = options;

    this.client = new Client({
      name: "mcp-typescript-client",
      version: "1.0.0",
    });
  }

  async initialize(options: MCPClientOptions) {
    const url = options.mcpServerConfig?.url;

    if (!url) {
      return this.client;
    }

    const baseUrl = new URL(url);

    try {
      const transport = new StreamableHTTPClientTransport(new URL(baseUrl));

      await this.client.connect(transport);
      console.log("Connected using Streamable HTTP transport");
    } catch (error) {
      // If that fails with a 4xx error, try the older SSE transport
      console.log(
        "Streamable HTTP connection failed, falling back to SSE transport"
      );
      const sseTransport = new SSEClientTransport(baseUrl);

      await this.client.connect(sseTransport);
      console.log("Connected using SSE transport");
    }

    this.tools = (await this.client.listTools()).tools as unknown as Tool[];
    console.log(
      `Connected to server with tools: ${this.tools
        .map((tool) => tool.name)
        .join(", ")}`
    );

    return this.client;
  }

  async chat(body: ChatBody) {
    const { apiKey } = this.options.llmConfig;
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      return res.json();
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async processQuery(query: string) {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "user",
          content: query,
        },
      ];

      const availableTools = this.tools.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name as string,
          description: tool.description as string,
          parameters: {
            type: "object" as const,
            properties: tool.inputSchema.properties as Record<string, unknown>,
            required: tool.inputSchema.required as string[],
          },
        },
      }));

      let iterationCount = this.options.llmConfig.iterationCount || 1;

      const finalText: string[] = [];
      const toolResults = [];

      const response = await this.chat({
        model: this.options.llmConfig.model,
        messages: [
          {
            role: "system",
            content: this.options.llmConfig.systemPrompt,
          },
          ...messages,
        ],
        tools: availableTools,
      });

      let message = response?.choices?.[0]?.message;

      while (iterationCount > 0 && message?.tool_calls) {
        for (const toolCall of message?.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          console.log(
            `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
          );
          const result = await this.client.callTool({
            name: toolName,
            arguments: toolArgs,
          });

          toolResults.push({ call: toolName, result });

          messages.push(response.choices[0].message);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result.content),
          } as ChatCompletionMessageParam);
        }

        const nextResponse = await this.chat({
          model: this.options.llmConfig.model,
          messages: [
            {
              role: "system",
              content: this.options.llmConfig.systemPrompt,
            },
            ...messages,
          ],
          tools: availableTools,
        });

        message = nextResponse.choices[0].message;

        finalText.push(message?.content || "");

        iterationCount--;
      }

      return {
        text: finalText.join("\n"),
        toolResults,
      };
    } catch (error) {
      console.error("Error processing query:", error);
      throw error;
    }
  }

  async cleanup() {
    if (this.client) {
      await this.client.close();
    }
  }
}

export async function createMCPClient(options: MCPClientOptions) {
  try {
    const client = new MCPClient(options);
    await client.initialize(options);
    return client;
  } catch (error) {
    return null;
  }
}
