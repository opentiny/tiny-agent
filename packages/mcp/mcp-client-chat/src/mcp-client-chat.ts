import { Readable } from 'node:stream';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  MCPClientOptions,
  ChatBody,
  CallToolsParams,
  ToolResults,
  McpServer,
  ChatCompleteResponse,
  NonStreamingChoice,
  Message,
  Role,
  ToolCall,
  AgentStrategy,
} from './type.js';
import { toolPromptTemplate } from './template.js';
import { extractActions } from './utils.js';

export class McpClientChat {
  protected options: MCPClientOptions;
  protected iterationSteps;
  protected clientsMap: Map<string, Client> = new Map();
  protected toolClientMap: Map<string, Client> = new Map();
  protected messages: Message[] = [];

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

  protected async initClients(serverName: string, serverConfig: McpServer) {
    const client = new Client({
      name: serverName,
      version: '1.0.0',
    });
    const { url } = serverConfig;
    const baseUrl = new URL(url);

    try {
      const transport = new StreamableHTTPClientTransport(baseUrl, {
        requestInit: {
          headers: serverConfig.headers
        }
      });

      await client.connect(transport);
    } catch (error) {
      // SSEClientTransport will dump requestInit.headers (version 1.11.4)
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
      role: Role.USER,
      content: [],
    };

    this.messages.push(defaultUserMessage);

    return defaultUserMessage;
  }

  protected organizePromptMessages(message: Message) {
    this.messages.push(message);
  }

  protected clearPromptMessages() {
    this.messages = [];
  }

  async chat(queryOrMessages: string | Array<Message>) {
    if (typeof queryOrMessages === 'string') {
      this.organizePromptMessages({
        role: 'user',
        content: queryOrMessages,
      });
    } else {
      this.messages.push(...queryOrMessages);
    }

  
    this.iterationSteps = this.options.maxIterationSteps || 1;

    if (this.options.agentStrategy === 'ReAct') {
      return this.chatReAct();
    }

    return this.chatFunctionCalling();
  }

  protected async chatReAct() {
    try {
      const toolsCallResults: ToolResults = [];
      const systemPrompt = await this.initSystemPromptMessages();

      this.messages.push({
        role: Role.SYSTEM,
        content: systemPrompt,
      });

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

        const message = (response.choices[0] as NonStreamingChoice).message;

        // const { tool_calls } = this.getActionFromContent(message.content || '');
        const tool_calls = extractActions(message.content || '');

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
          } catch (error) {
            this.organizePromptMessages({
              role: Role.ASSISTANT,
              content: 'call tools failed!',
            });

            this.iterationSteps = 0;
          }
        } else {
          this.organizePromptMessages({
            role: Role.ASSISTANT,
            content: message.content ?? '',
          });

          this.iterationSteps = 0;
        }
      }

      const summaryPrompt = '用简短的话总结！';
      const result = await this.queryChatCompleteStreaming({
        messages: [...this.messages, { role: Role.USER, content: summaryPrompt }],
      });

      return result;
    } catch (error) {
      return {
        code: 500,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  protected getActionFromContent(content: string): { tool_calls: ToolCall[] } {
    const actionStr = 'action:';
    const actionInputStr = 'action-input:';
    // 使用正则表达式匹配 JSON 对象
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const tool_calls: ToolCall[] = [];

    if (!jsonMatch) {
      return { tool_calls };
    }

    const jsonStr = jsonMatch[0];
    const { action, action_input = {} } = JSON.parse(jsonStr);

    tool_calls.push({
      id: action,
      type: 'function',
      function: {
        name: action,
        arguments: action_input,
      },
    });

    return { tool_calls };
  }

  protected async initSystemPromptMessages(): Promise<string> {
    const tools = await this.fetchToolsList();

    const systemPrompt = toolPromptTemplate
      .replace('{{instruction}}', this.options.llmConfig.systemPrompt)
      .replace('{{tools}}', tools.map((tool) => JSON.stringify(tool.function)).join(','))
      .replace('{{tool_names}}', tools.map((item) => item.function.name).join(','));

    return systemPrompt;
  }

  protected async chatFunctionCalling() {
    try {
      const availableTools = await this.fetchToolsList();
      const toolsCallResults: ToolResults = [];

      this.messages.push({
        role: Role.SYSTEM,
        content: this.options.llmConfig.systemPrompt,
      });

      while (this.iterationSteps > 0) {
        const response: ChatCompleteResponse | Error = await this.queryChatComplete({
          messages: this.messages,
          tools: this.iterationSteps > 1 ? availableTools : [],
        });

        if (response.choices?.[0]?.error) {
          this.organizePromptMessages({
            role: Role.ASSISTANT,
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
            role: Role.ASSISTANT,
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
            this.organizePromptMessages({
              role: Role.ASSISTANT,
              content: 'call tools failed!',
            });

            this.iterationSteps = 0;
          }
        } else {
          this.organizePromptMessages({
            role: Role.ASSISTANT,
            content: message.content ?? '',
          });

          this.iterationSteps = 0;
        }
      }

      const summaryPrompt = '用简短的话总结！';
      const result = await this.queryChatCompleteStreaming({
        messages: [...this.messages, { role: Role.USER, content: summaryPrompt }],
      });

      return result;
    } catch (error) {
      return {
        code: 500,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  protected async callTools(toolCalls: ToolCall[]) {
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
        } catch (error) {
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
      console.error('Error calling chat/complete:', error);

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
      console.error('Error calling streaming chat/complete:', error);

      throw new Error(`Streaming chat API call failed: ${String(error)}`);
    } finally {
      // TODO: Implement context memory feature, for now clear after each request
      this.clearPromptMessages();
    }
  }
}
