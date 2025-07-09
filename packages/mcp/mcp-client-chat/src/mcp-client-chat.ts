import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';
import type { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';
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
  OpenAIRawStreamOutput,
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
  protected messages: Message[] = [];
  protected transformStream = new TransformStream();
  protected chatOptions?: IChatOptions;
  protected sdk: OpenAI | null = null;

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

      if (!client) {
        continue;
      }

      this.clientsMap.set(serverName, client);
    }

    if (this.options.llmConfig.useSDK) {
      this.sdk = new OpenAI({
        baseURL: this.options.llmConfig.url,
        apiKey: this.options.llmConfig.apiKey,
      });
    } else {
      this.sdk = null;
    }
  }

  protected async initClients(
    serverName: string,
    serverConfig: McpServer | CustomTransportMcpServer,
  ): Promise<Client | null> {
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
      try {
        const sseTransport = new SSEClientTransport(baseUrl, {
          requestInit: {
            headers: serverConfig.headers,
          },
        });

        await client.connect(sseTransport);
      } catch (error) {
        return null;
      }
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

      await this.queryChatCompleteStreaming();
    } catch (error) {
      console.error('Chat iteration failed:', error);
      throw error;
    }
  }

  protected async callTools(toolCalls: ToolCall[]): Promise<{ results: ToolResults; messages: Message[] }> {
    const results: ToolResults = [];
    const messages: Message[] = [];

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

        let callToolResult = null

        try {
          callToolResult = (await client.callTool({
            name: toolName,
            arguments: toolArgs,
          })) as CallToolResult;
        } catch (error) {
          if (this.chatOptions?.toolCallResponse) {
            await this.writeMessageDelta(`[${toolCall.function.name}] Tool call result: failed \n\n`, 'assistant', {
              toolCall,
              callToolResult: {
                isError: true,
                error: error instanceof Error ? error.message : String(error),
              },
            });
          }

          callToolResult = { isError: true, content: [{ type: 'text', text: `Failed to call tool "${toolName}".` }] } as CallToolResult;
        }

        const callToolContent = this.getToolCallMessage(callToolResult);
        const message: Message = {
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

        const message: Message = {
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

  protected async queryChatByREST(isStream: boolean = false): Promise<ChatCompleteResponse | ReadableStream> {
    const { url, apiKey } = this.options.llmConfig;
    const chatBody = await this.getChatBody();
    const requestBody = { ...chatBody };

    if (isStream) {
      requestBody.stream = true;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }

    if (isStream) {
      if (!response.body) {
        throw new Error('Response body is null');
      }

      return response.body;
    }

    try {
      const res = await response.json();

      return res;
    } catch (error) {
      console.error(error);
    }

    // return await response.json();
  }

  protected async queryChatBySDK(isStream: boolean = false): Promise<OpenAIRawStreamOutput | OpenAI.ChatCompletion> {
    const chatBody = await this.getChatBody();
    const requestBody = { ...chatBody };

    if (isStream) {
      requestBody.stream = true;
    }

    const response = await (this.sdk as OpenAI).chat.completions.create(requestBody as ChatCompletionCreateParamsBase);

    return response;
  }

  protected async queryChatComplete(): Promise<OpenAIRawStreamOutput | OpenAI.ChatCompletion> {
    try {
      const queryFn = this.options.llmConfig.useSDK ? this.queryChatBySDK : this.queryChatByREST;
      const response = await queryFn.call(this);

      return response;
    } catch (error) {
      console.error('Error calling chat/complete:', error);

      return error as Error;
    }
  }

  protected async queryChatCompleteStreaming(): Promise<void> {
    try {
      const queryFn = this.options.llmConfig.useSDK ? this.queryChatBySDK : this.queryChatByREST;
      const response = await queryFn.call(this, true);

      return await this.handleStreamResponse(response);
    } catch (error) {
      console.error('Error calling streaming chat/complete:', error);

      throw new Error(`Streaming chat API call failed: ${String(error)}`);
    } finally {
      // TODO: Implement context memory feature, for now clear after each request
      this.clearPromptMessages();
    }
  }

  protected async handleStreamResponse(response: OpenAIRawStreamOutput | ReadableStream): Promise<void> {
    if (this.options.llmConfig.useSDK) {
      const writer = this.transformStream.writable.getWriter();
      const encoder = new TextEncoder();

      for await (const chunk of response as OpenAIRawStreamOutput) {
        const json = JSON.stringify(chunk);
        await writer.write(encoder.encode('data: ' + json + '\n'));
      }
      await writer.close();
    } else {
      (response as ReadableStream).pipeTo(this.transformStream.writable);
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
