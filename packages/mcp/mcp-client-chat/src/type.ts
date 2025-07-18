import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type OpenAI from 'openai';

export interface McpServer {
  url: string;
  headers?: Record<string, string>;
  timeout?: number; // TODO
  customTransport: never;
}

export interface CustomTransportMcpServer<T = any> {
  config: T;
  customTransport: Transport | ((config: T) => Transport);
}

export type McpServers = Record<string, McpServer | CustomTransportMcpServer>;

export interface McpServerConfig {
  mcpServers: McpServers;
}

export type McpServersConfig = Record<string, McpServerConfig | any>;

export enum AgentStrategy {
  FUNCTION_CALLING = 'Function Calling',
  RE_ACT = 'ReAct',
}

export type LlmConfig = {
  baseURL: string; // AI interface address
  apiKey: string;
  model: string;
  systemPrompt: string; // Instructions
  summarySystemPrompt?: string; // Summary instructions for each round of chat
} & Omit<ChatCompleteRequest, 'messages' | 'stream' | 'model'>;

export interface MCPClientOptions {
  useSDK?: boolean;
  agentStrategy?: AgentStrategy;
  llmConfig: LlmConfig;
  mcpServersConfig: McpServersConfig; // MCP service configuration
  maxIterationSteps?: number; // Maximum execution steps
}

export interface AvailableTool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: {
      type: 'object';
      properties?: Record<string, unknown>;
      required?: string[];
    };
  };
}

export interface CallToolsParams {
  toolCalls: ToolCall[];
}

export interface ChatBody {
  stream?: boolean;
  model: string;
  messages: ChatCompletionMessageParam[];
  tools?: AvailableTool[];
}

export type ToolResults = Array<{ call: string; result: CallToolResult }>;

export enum Role {
  FUNCTION = 'function',
  USER = 'user',
  ASSISTANT = 'assistant',
  DEVELOPER = 'developer',
  SYSTEM = 'system',
  TOOL = 'tool',
}

export type ErrorResponse = {
  code: number; // See "Error Handling" section
  message: string;
  metadata?: Record<string, unknown>; // Contains additional error information such as provider details, the raw error message, etc.
};

export type FunctionCall = {
  name: string;
  arguments: string;
};

export type ToolCall = {
  id: string;
  type: 'function';
  function: FunctionCall;
};

export type NonChatChoice = {
  finish_reason: string | null;
  text: string;
  error?: ErrorResponse;
};

export type NonStreamingChoice = {
  finish_reason: string | null;
  native_finish_reason: string | null;
  message: {
    content: string | null;
    role: Role;
    tool_calls?: ToolCall[];
  };
  error?: ErrorResponse;
};

export type StreamingChoice = {
  finish_reason: string | null;
  native_finish_reason: string | null;
  delta: {
    content: string | null;
    role?: Role;
    tool_calls?: ToolCall[];
  };
  error?: ErrorResponse;
};

export type ResponseUsage = {
  /** Including images and tools if any */
  prompt_tokens: number;
  /** The tokens generated */
  completion_tokens: number;
  /** Sum of the above two fields */
  total_tokens: number;
};

export type ChatCompleteResponse = {
  id: string;
  choices: (NonStreamingChoice | StreamingChoice | NonChatChoice)[];
  // choices: NonStreamingChoice[];
  created: number;
  model: string;
  object: 'chat.completion' | 'chat.completion.chunk';
  system_fingerprint?: string;
  usage?: ResponseUsage;
};

export type ChatCompletionRole = OpenAI.Chat.Completions.ChatCompletionRole;

export type ChatCompleteRequest = OpenAI.Chat.Completions.ChatCompletionCreateParams;

export type ChatCompletionMessageParam = OpenAI.Chat.Completions.ChatCompletionMessageParam;
/**
 * Represents a streamed chunk of a chat completion response returned by the model,
 * based on the provided input.
 */
export type ChatCompletionChunk = OpenAI.Chat.Completions.ChatCompletionChunk;

export type ChatCompletionTool = OpenAI.Chat.Completions.ChatCompletionTool;

export interface IChatOptions {
  toolCallResponse?: boolean;
}
