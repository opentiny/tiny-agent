import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import { extractActions } from './utils.js';
import { AgentStrategy, Role } from './type.js';

import { FORMAT_INSTRUCTIONS, PREFIX, SUFFIX } from './ReActSystemPrompt.js';
import type {
  AvailableTool,
  ChatBody,
  ChatCompleteResponse,
  ChatCreatePromptArgs,
  IChatOptions,
  MCPClientOptions,
  McpServer,
  Message,
  NonStreamingChoice,
  ToolCall,
  ToolResults,
  CustomTransportMcpServer,
} from './type.js';

export function isCustomTransportMcpServer(serverConfig: McpServer | CustomTransportMcpServer): serverConfig is CustomTransportMcpServer {
  return !!serverConfig.customTransport;
}
const DEFAULT_AGENT_STRATEGY = AgentStrategy.FUNCTION_CALLING;
export class McpClientChat {
  protected options: MCPClientOptions;
  protected iterationSteps: number;
  protected clientsMap: Map<string, Client> = new Map<string, Client>();
  protected toolClientMap: Map<string, Client> = new Map<string, Client>();
  protected messages: Message[] = [];
  protected transformStream: TransformStream = new TransformStream();
  protected chatOptions?: IChatOptions;

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
        clientTransport = serverConfig.customTransport
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

  async chat(queryOrMessages: string | Array<Message>, chatOptions?: IChatOptions): Promise<ReadableStream | Error> {
    this.chatOptions = chatOptions;

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
      const chatIteration = async () => {
        while (this.iterationSteps > 0) {
          const chatBody = await this.getChatBody();
          const response: ChatCompleteResponse | Error = await this.queryChatComplete(chatBody);

          if (response.choices?.[0]?.error) {
            this.organizePromptMessages({
              role: Role.ASSISTANT,
              content: response.choices[0].error.message,
            });
            this.iterationSteps = 0;

            continue;
          }

          const [tool_calls, finalAnswer] = await this.organizeToolCalls(response.choices[0] as NonStreamingChoice);

          // 工具调用
          if (tool_calls.length) {
            try {
              const { toolResults, toolCallMessages } = await this.callTools(tool_calls);

              toolsCallResults.push(...toolResults);
              toolCallMessages.forEach((m) => this.organizePromptMessages(m));

              this.iterationSteps--;
            } catch (_error) {
              this.organizePromptMessages({
                role: 'assistant',
                content: 'call tools failed!',
              });

              this.iterationSteps = 0;
            }
          } else {
            this.organizePromptMessages({
              role: 'assistant',
              content: finalAnswer,
            });

            this.iterationSteps = 0;
          }
        }

        const summaryPrompt = '用简短的话总结！';
        this.organizePromptMessages({ role: Role.USER, content: summaryPrompt });
        const chatBody = await this.getChatBody(true);
        const result = await this.queryChatCompleteStreaming(chatBody);
        return result;
      };

      chatIteration()
        .then(async (result) => {
          await result.pipeTo(this.transformStream.writable);
        })
        .catch((error) => {
          console.error('Chat iteration failed:', error);
          this.transformStream!.writable.abort(error);
        });

      return this.transformStream.readable;
    } catch (error) {
      return error as Error;
    }
  }

  protected async getChatBody(stream = false): Promise<ChatBody> {
    const { model } = this.options.llmConfig;
    const chatBody: ChatBody = {
      model,
      messages: this.messages,
    };

    if (this.options.agentStrategy === AgentStrategy.FUNCTION_CALLING) {
      const tools = await this.fetchToolsList();

      chatBody.tools = this.iterationSteps > 0 ? tools : [];
    }

    if (stream) {
      chatBody.stream = stream;
    }

    return chatBody;
  }

  protected async organizeToolCalls(choice: NonStreamingChoice): Promise<[ToolCall[], string]> {
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

  protected async createReActSystemPrompt(args?: ChatCreatePromptArgs): Promise<string> {
    const tools = await this.fetchToolsList();

    const toolStrings = JSON.stringify(tools);
    const { prefix = PREFIX, suffix = SUFFIX, formatInstructions = FORMAT_INSTRUCTIONS } = args ?? {};
    const prompt = [prefix, toolStrings, formatInstructions, suffix].join('\n\n');

    return prompt;
  }

  protected async initSystemPromptMessages(args?: ChatCreatePromptArgs): Promise<string> {
    if (this.options.agentStrategy === AgentStrategy.FUNCTION_CALLING) {
      return this.options.llmConfig.systemPrompt;
    }

    return this.createReActSystemPrompt(args);
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

        if (this.chatOptions?.toolCallResponse) {
          await this.writeMessageDelta('Tool call result: ' + JSON.stringify(callToolContent) + '\n\n', 'assistant', {
            toolCall,
            callToolResult,
          });
        }
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
    const { url, apiKey } = this.options.llmConfig;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
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

  protected async queryChatCompleteStreaming(chatBody: ChatBody): Promise<ReadableStream> {
    const { url, apiKey } = this.options.llmConfig;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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

  protected async writeMessageDelta(messageDeltaContent: string, role: string = 'assistant', extra?: any) {
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
}
