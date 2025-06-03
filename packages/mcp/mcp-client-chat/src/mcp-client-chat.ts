import { Readable } from 'node:stream';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import type {
  AvailableTool,
  ChatBody,
  ChatCompleteResponse,
  MCPClientOptions,
  McpServer,
  Message,
  NonStreamingChoice,
  ToolCall,
  ToolResults,
} from './type.js';
import { AgentStrategy, Role } from './type.js';
import { toolPromptTemplate } from './template.js';
import { extractActions } from './utils.js';

export class McpClientChat {
  protected options: MCPClientOptions;
  protected iterationSteps: number;
  protected clientsMap: Map<string, Client> = new Map<string, Client>();
  protected toolClientMap: Map<string, Client> = new Map<string, Client>();
  protected messages: Message[] = [];

  constructor(options: MCPClientOptions) {
    this.options = options;
    this.iterationSteps = options.maxIterationSteps || 1;
  }

  async init(): Promise<void> {
    const { mcpServers = {} } = this.options.mcpServersConfig;

    for (const [serverName, serverConfig] of Object.entries(mcpServers)) {
      const client = await this.initClients(serverName, serverConfig as McpServer);

      this.clientsMap.set(serverName, client);
    }
  }

  protected async initClients(serverName: string, serverConfig: McpServer): Promise<Client> {
    const client = new Client({
      name: serverName,
      version: '1.0.0',
    });
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
      const sseTransport = new SSEClientTransport(baseUrl);

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

  protected getUserMessages(): Message {
    const userMessage = this.messages.find((m) => m.role === 'user');

    if (userMessage) {
      return userMessage;
    }

    const defaultUserMessage: Message = {
      role: Role.USER,
      content: [],
    };

    this.messages.push(defaultUserMessage);

    return defaultUserMessage;
  }

  protected organizePromptMessages(message: Message): void {
    this.messages.push(message);
  }

  protected clearPromptMessages(): void {
    this.messages = [];
  }

  async chat(queryOrMessages: string | Array<Message>): Promise<Readable | Error> {
    const systemPrompt = await this.initSystemPromptMessages();

    this.messages.push({
      role: Role.SYSTEM,
      content: systemPrompt,
    });

    if (typeof queryOrMessages === 'string') {
      this.organizePromptMessages({
        role: 'user',
        content: queryOrMessages,
      });
    } else {
      this.messages.push(...queryOrMessages);
    }

    this.iterationSteps = this.options.maxIterationSteps || 1;

    try {
      const toolsCallResults: ToolResults = [];

      while (this.iterationSteps > 0) {
        const response: ChatCompleteResponse | Error = await this.queryChatComplete({
          messages: this.messages,
        });

        if (response.choices?.[0]?.error) {
          this.organizePromptMessages({
            role: Role.ASSISTANT,
            content: response.choices[0].error.message,
          });
          this.iterationSteps = 0;

          continue;
        }

        const [tool_calls, finalAnswer] = this.organizeToolCalls(response.choices[0] as NonStreamingChoice);

        // 工具调用
        if (tool_calls.length) {
          this.organizePromptMessages({
            role: Role.ASSISTANT,
            content: JSON.stringify({ tool_calls }),
          });

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

      const summaryPrompt = '一句话总结';
      const result = await this.queryChatCompleteStreaming({
        messages: [...this.messages, { role: Role.USER, content: summaryPrompt }],
      });

      return result;
    } catch (error) {
      return error as Error;
    }
  }

  protected organizeToolCalls(choice: NonStreamingChoice): [ToolCall[], string] {
    if (this.options.agentStrategy === AgentStrategy.FUNCTION_CALLING) {
      return this.extractFunctionCalls(choice);
    }

    return extractActions(choice.message.content || '');
  }

  protected extractFunctionCalls(choice: NonStreamingChoice): [ToolCall[], string] {
    const toolCalls = choice.message.tool_calls || [];
    let finalAnswer = '';

    if (!toolCalls.length) {
      finalAnswer = choice.message.content ?? '';
    }

    return [toolCalls, finalAnswer];
  }

  protected async initSystemPromptMessages(): Promise<string> {
    if (this.options.agentStrategy === AgentStrategy.FUNCTION_CALLING) {
      return this.options.llmConfig.systemPrompt;
    }

    const tools = await this.fetchToolsList();

    const systemPrompt = toolPromptTemplate
      .replace('{{instruction}}', this.options.llmConfig.systemPrompt)
      .replace('{{tools}}', tools.map((tool) => JSON.stringify(tool.function)).join(','))
      .replace('{{tool_names}}', tools.map((item) => item.function.name).join(','));

    return systemPrompt;
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
          toolArgs = JSON.parse(toolCall.function.arguments || '{}');
        } catch (_error) {
          toolArgs = {};
        }

        // 调用工具
        const callToolResult = (await client.callTool({
          name: toolName,
          arguments: toolArgs,
        })) as CallToolResult;
        const callToolContent = this.getToolCallMessage(callToolResult);
        const message: Message = {
          role: Role.TOOL,
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
      console.error('Error calling chat/complete:', error);

      throw error;
    }
  }

  protected async queryChatCompleteStreaming(body: ChatBody, stream = true): Promise<Readable> {
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
      console.error('Error calling streaming chat/complete:', error);

      throw new Error(`Streaming chat API call failed: ${String(error)}`);
    } finally {
      // TODO: Implement context memory feature, for now clear after each request
      this.clearPromptMessages();
    }
  }
}
