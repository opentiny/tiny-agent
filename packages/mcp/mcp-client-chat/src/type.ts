import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

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
  messages: Message[];
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

export type TextContent = {
  type: 'text';
  text: string;
};

export type ImageContentPart = {
  type: 'image_url';
  image_url: {
    url: string; // URL or base64 encoded image data
    detail?: string; // Optional, defaults to "auto"
  };
};

export type ContentPart = TextContent | ImageContentPart;

export type Message =
  | {
      role: 'user' | 'system';
      // ContentParts are only for the "user" role:
      content: string | ContentPart[];
      // If "name" is included, it will be prepended like this
      // for non-OpenAI models: `{name}: {content}`
      name?: string;
    }
  | {
      role: 'assistant';
      content: string | ContentPart[];
      tool_calls?: ToolCall[];
      name?: string;
    }
  | {
      role: 'tool';
      content: string;
      tool_call_id: string;
      name?: string;
    };

export type FunctionDescription = {
  description?: string;
  name: string;
  parameters: object; // JSON Schema object
};

export type Tool = {
  type: 'function';
  function: FunctionDescription;
};

export type ToolChoice =
  | 'none'
  | 'auto'
  | {
      type: 'function';
      function: {
        name: string;
      };
    };

export type ChatCompleteRequest = {
  // Either "messages" or "prompt" is required
  messages?: Message[];
  prompt?: string;
  model?: string;
  response_format?: { type: 'json_object' };
  stop?: string | string[];
  stream?: boolean; // Enable streaming
  max_tokens?: number; // Range: [1, context_length)
  temperature?: number; // Range: [0, 2]
  tools?: Tool[];
  tool_choice?: ToolChoice;
  seed?: number; // Integer only
  top_p?: number; // Range: (0, 1]
  top_k?: number; // Range: [1, Infinity) Not available for OpenAI models
  frequency_penalty?: number; // Range: [-2, 2]
  presence_penalty?: number; // Range: [-2, 2]
  repetition_penalty?: number; // Range: (0, 2]
  logit_bias?: Record<number, number>;
  top_logprobs?: number; // Integer only
  min_p?: number; // Range: [0, 1]
  top_a?: number; // Range: [0, 1]
  prediction?: { type: 'content'; content: string };
  transforms?: string[];
  models?: string[];
  route?: 'fallback';
  // provider?: ProviderPreferences;
};

export interface IChatOptions {
  toolCallResponse?: boolean;
}

/**
 * Interface for arguments used to create a chat prompt.
 */
export interface ChatCreatePromptArgs {
  /** String to put after the list of tools. */
  suffix?: string;
  /** String to put before the list of tools. */
  prefix?: string;
  /** String to use directly as the human message template. */
  humanMessageTemplate?: string;
  /** Formattable string to use as the instructions template. */
  formatInstructions?: string;
  /** List of input variables the final prompt will expect. */
  inputVariables?: string[];
}
