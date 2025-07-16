// OpenAI Chat Completions API 类型定义（2024-10-21）
// 参考：https://platform.openai.com/docs/api-reference/chat/create

export type ChatCompletionRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatCompletionMessage {
  role: ChatCompletionRole;
  content: string | null;
  // assistant 角色可带 tool_calls
  tool_calls?: ChatCompletionToolCall[];
  // Azure 专用，带 citations/context
  context?: Record<string, any>;
  // tool 角色需带 tool_call_id
  tool_call_id?: string;
  name?: string;
}

export interface ChatCompletionToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatCompletionMessage[];
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  max_completion_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
  tools?: ChatCompletionTool[];
  tool_choice?: 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } };
  function_call?: string | { name: string }; // 已废弃，建议用 tool_choice
  functions?: ChatCompletionTool[]; // 已废弃，建议用 tools
  response_format?: { type: 'json_object' } | { type: 'json_schema'; json_schema: object };
  seed?: number;
  logprobs?: boolean;
  top_logprobs?: number;
  parallel_tool_calls?: boolean;
  data_sources?: any[]; // Azure 专用
}

export interface ChatCompletionTool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: object; // JSON Schema
  };
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    finish_reason: string | null;
    message: ChatCompletionMessage;
  }>;
  usage?: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
  system_fingerprint?: string;
}

export interface ChatCompletionStreamResponse {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: Partial<ChatCompletionMessage>;
    finish_reason: string | null;
  }>;
}

// === 错误类型 ===

// 非流式响应错误
export interface OpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string | number;
    [key: string]: any;
  };
}

// 流式响应错误事件（SSE）
export interface OpenAIStreamErrorEvent {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string | number;
    [key: string]: any;
  };
}

// 扩展联合类型，流式响应可能事件
export type ChatCompletionStreamResponseWithError =
  | ChatCompletionStreamResponse
  | OpenAIStreamErrorEvent;

