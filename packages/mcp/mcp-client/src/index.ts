import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import dotenv from "dotenv";

dotenv.config();

// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// if (!OPENAI_API_KEY) {
//   throw new Error("OPENAI_API_KEY is not set");
// }

export interface MCPClientOptions {
  serverScriptPath: string;
  apiKey: string;
  model: string;
  baseURL: string;
}

export class MCPClient {
  private options: MCPClientOptions;
  private client: Client;
  private openai: OpenAI;
  private tools: Tool[] = [];

  constructor(options: MCPClientOptions) {
    this.options = options

    this.openai = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseURL
    });
    this.client = new Client({ name: "mcp-typescript-client", version: "1.0.0" });
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
    return this.tools.map(tool => tool.name);
  }

  async processQuery(query: string) {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "user",
          content: query,
        },
      ];

      const availableTools = this.tools.map(tool => ({
        type: "function" as const,
        function: {
          name: tool.name as string,
          description: tool.description as string,
          parameters: {
            type: 'object',
            properties: tool.inputSchema.properties as Record<string, unknown>,
            required: tool.inputSchema.required as string[],
          }
        }
      }));

      const response = await this.openai.chat.completions.create({
        model: this.options.model,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant with access to tools."
          },
          ...messages
        ],
        tools: availableTools,
      });

      const finalText: string[] = [];
      const toolResults = []

      const content = response.choices[0].message.tool_calls;

      if (content) {
        for (const toolCall of content) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          console.log(`[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`);
          const result = await this.client.callTool({
            name: toolName,
            arguments: toolArgs,
          });

          toolResults.push({ call: toolName, result })

          messages.push(response.choices[0].message);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result.content)
          } as ChatCompletionMessageParam);
        }

        const nextResponse = await this.openai.chat.completions.create({
          model: this.options.model,
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant with access to tools."
            },
            ...messages,
          ],
          tools: availableTools,
        })

        finalText.push(nextResponse.choices[0].message.content || "")
      } else {
        finalText.push(response.choices[0].message.content || "")
      }

      return {
        text: finalText.join('\n'),
        toolResults
      }
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

// 导出便捷的工厂函数
export async function createMCPClient(options: MCPClientOptions) {
  const client = new MCPClient(options);
  await client.initialize(options.serverScriptPath);
  return client;
}

// 如果直接运行此文件，则启动交互式聊天
if (require.main === module) {
  import('readline/promises').then(async (readline) => {
    if (process.argv.length < 3) {
      console.log("Usage: node index.js <path_to_server_script>");
      process.exit(1);
    }

    const client = await createMCPClient({
      apiKey: process.env.OPENAI_API_KEY as string,
      model: process.env.OPENAI_MODEL as string,
      baseURL: process.env.OPENAI_BASE_URL as string,
      serverScriptPath: process.argv[2]
    });

    const rl = readline.default.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log("\nMCP Client Started!");
      console.log("Type your queries or 'quit' to exit.");

      while (true) {
        const message = await rl.question("\nQuery: ");
        if (message.toLowerCase() === "quit") {
          break;
        }

        try {
          const response = await client.processQuery(message);
          console.log("\n" + response.text);
        } catch (error) {
          console.log("\nError:", error)
        }
      }
    } finally {
      rl.close();
      await client.cleanup();
    }
  }).catch(console.error);
}