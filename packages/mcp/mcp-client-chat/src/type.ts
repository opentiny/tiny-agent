export interface McpServer {
  url: string;
  header?: Record<string, string>;
  timeout?: number;
}

export type McpServers = Record<string, McpServer>;

export interface McpServerConfig {
  mcpServers: McpServers;
}

export type McpServersConfig = Record<string, McpServerConfig | any>;

export interface MCPClientOptions {
  llmConfig: {
    // 模型配置
    url: string; // ai 接口地址
    apiKey: string; // 模型 api key
    model: string; // 模型名
    systemPrompt: string; // 指令
  };
  mcpServersConfig: McpServersConfig; // MCP 服务配置
  maxIterationSteps?: number; // 最大执行步数
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
  toolCalls: {
    id: string;
    function: {
      name: string;
      arguments: string;
    };
  }[];
}

export interface ChatBody {
  messages: Message[];
  tools?: AvailableTool[];
}

export type ToolResults = Array<{ call: string; result: any }>;

export type Role = 'function' | 'user' | 'assistant' | 'developer' | 'system' | 'tool';

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
  choices: (NonStreamingChoice | NonChatChoice)[];
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
      role: 'user' | 'assistant' | 'system';
      // ContentParts are only for the "user" role:
      content: string | ContentPart[];
      // If "name" is included, it will be prepended like this
      // for non-OpenAI models: `{name}: {content}`
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
  logit_bias?: { [key: number]: number };
  top_logprobs: number; // Integer only
  min_p?: number; // Range: [0, 1]
  top_a?: number; // Range: [0, 1]
  prediction?: { type: 'content'; content: string };
  transforms?: string[];
  models?: string[];
  route?: 'fallback';
  // provider?: ProviderPreferences;
};
