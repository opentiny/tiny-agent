import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import dotenv from "dotenv";

dotenv.config();

export interface MCPClientOptions {
  serverScriptPath: string;
  apiKey: string;
  model: string;
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

  async initialize(serverScriptPath: string) {
    const isPython = serverScriptPath.endsWith(".py");
    const isJs = serverScriptPath.endsWith(".js");

    if (!isPython && !isJs) {
      throw new Error("Server script must be a .py or .js file");
    }

    const command = isPython ? "python" : "node";
    const transport = new StdioClientTransport({
      command,
      args: [serverScriptPath],
    });

    await this.client.connect(transport);
    this.tools = (await this.client.listTools()).tools as unknown as Tool[];
    return this.tools.map((tool) => tool.name);
  }

  async chat(body: ChatBody) {
    const { apiKey } = this.options;
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

      const response = await this.chat({
        model: this.options.model,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant with access to tools.",
          },
          ...messages,
        ],
        tools: availableTools,
      });

      const finalText: string[] = [];
      const toolResults = [];

      const content = response?.choices?.[0]?.message?.tool_calls;

      if (content) {
        for (const toolCall of content) {
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
          model: this.options.model,
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant with access to tools.",
            },
            ...messages,
          ],
          tools: availableTools,
        });

        finalText.push(nextResponse.choices[0].message.content || "");
      } else {
        finalText.push(response.choices[0].message.content || "");
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
  const client = new MCPClient(options);
  await client.initialize(options.serverScriptPath);
  return client;
}
