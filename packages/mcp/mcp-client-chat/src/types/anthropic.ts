// Anthropic Messages API 类型定义（2024-06-01）
// 参考：https://docs.anthropic.com/claude/reference/messages_post

export type AnthropicMessageRole = 'user' | 'assistant';

export type AnthropicContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: AnthropicImageSource };

export type AnthropicImageSource =
  | { type: 'base64'; media_type: string; data: string }
  | { type: 'url'; url: string };

export interface AnthropicMessage {
  role: AnthropicMessageRole;
  // content: string | AnthropicContentBlock[];
  content: string | AnthropicContentBlock[];
}

export interface AnthropicTool {
  name: string;
  description?: string;
  input_schema: object; // JSON Schema
  type?: 'custom';
  cache_control?: {
    type: 'ephemeral';
    ttl?: '5m' | '1h';
  };
}

export interface AnthropicToolChoice {
  type: 'auto';
  disable_parallel_tool_use?: boolean;
}

export interface AnthropicThinking {
  type: 'enabled';
  budget_tokens: number;
}

export interface AnthropicMcpServer {
  name: string;
  type: 'url';
  url: string;
  authorization_token?: string | null;
  tool_configuration?: {
    allowed_tools?: string[] | null;
    enabled?: boolean | null;
  } | null;
}

export interface AnthropicMetadata {
  user_id?: string | null;
}

export type AnthropicServiceTier = 'auto' | 'standard_only';

export interface AnthropicMessageRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string | AnthropicContentBlock[];
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
  stream?: boolean;
  tools?: AnthropicTool[];
  tool_choice?: AnthropicToolChoice;
  thinking?: AnthropicThinking;
  container?: string | null;
  mcp_servers?: AnthropicMcpServer[];
  metadata?: AnthropicMetadata;
  service_tier?: AnthropicServiceTier;
}

export type AnthropicStopReason =
  | 'end_turn'
  | 'max_tokens'
  | 'stop_sequence'
  | 'tool_use'
  | 'pause_turn'
  | 'refusal';

export interface AnthropicMessageResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: AnthropicStopReason | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation?: {
      ephemeral_1h_input_tokens?: number;
      ephemeral_5m_input_tokens?: number;
    } | null;
    cache_creation_input_tokens?: number | null;
    cache_read_input_tokens?: number | null;
    server_tool_use?: {
      web_search_requests?: number;
    } | null;
    service_tier?: 'standard' | 'priority' | 'batch' | null;
  };
  container?: {
    expires_at: string;
    id: string;
  } | null;
}

// === 流式响应类型 ===

// 事件类型
export type AnthropicStreamEventType =
  | 'message_start'
  | 'content_block_start'
  | 'content_block_delta'
  | 'content_block_stop'
  | 'message_delta'
  | 'message_stop';

// message_start 事件
export interface AnthropicStreamMessageStartEvent {
  type: 'message_start';
  message: {
    id: string;
    type: 'message';
    role: 'assistant';
    content: AnthropicContentBlock[];
    model: string;
    stop_reason: null;
    stop_sequence: null;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
  };
}

// content_block_start 事件
export interface AnthropicStreamContentBlockStartEvent {
  type: 'content_block_start';
  index: number;
  content_block: AnthropicContentBlock;
}

// content_block_delta 事件
export interface AnthropicStreamContentBlockDeltaEvent {
  type: 'content_block_delta';
  index: number;
  delta: Partial<AnthropicContentBlock>;
}

// content_block_stop 事件
export interface AnthropicStreamContentBlockStopEvent {
  type: 'content_block_stop';
  index: number;
}

// message_delta 事件
export interface AnthropicStreamMessageDeltaEvent {
  type: 'message_delta';
  delta: {
    stop_reason?: AnthropicStopReason;
    stop_sequence?: string | null;
    usage?: {
      output_tokens: number;
    };
  };
}

// message_stop 事件
export interface AnthropicStreamMessageStopEvent {
  type: 'message_stop';
}

// 联合类型：所有流式事件
export type AnthropicStreamEvent =
  | AnthropicStreamMessageStartEvent
  | AnthropicStreamContentBlockStartEvent
  | AnthropicStreamContentBlockDeltaEvent
  | AnthropicStreamContentBlockStopEvent
  | AnthropicStreamMessageDeltaEvent
  | AnthropicStreamMessageStopEvent;

// === 错误类型 ===

// 非流式响应错误
export interface AnthropicErrorResponse {
  type: 'error';
  error: {
    type: string; // 错误类型，如 'invalid_request_error' 等
    message: string;
    code?: string | number;
    param?: string;
    // 其它 Anthropic 可能返回的字段
    [key: string]: any;
  };
}

// 流式响应错误事件（SSE）
export interface AnthropicStreamErrorEvent {
  type: 'error';
  error: {
    type: string;
    message: string;
    code?: string | number;
    param?: string;
    [key: string]: any;
  };
}

// 扩展联合类型，流式响应可能事件
export type AnthropicStreamEventWithError =
  | AnthropicStreamEvent
  | AnthropicStreamErrorEvent;

