export type Role = 'system' | 'user' | 'assistant';

/** 消息内容块类型，用于多模态、工具调用等 */
export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  | { type: 'tool_use'; name: string; id: string; input: any }
  | { type: 'tool_result'; name: string; id: string; output: any };

/** 单条消息，可引用多种内容块 */
export interface Message {
  role: Role;
  content: string | ContentBlock[];
}

/** 注册工具定义 */
export interface ToolDefinition {
  name: string;
  description?: string;
  input_schema: Record<string, any>; // JSON Schema
}

/** 工具使用策略 */
export interface ToolChoice {
  type: 'auto' | 'any' | 'tool' | 'none';
  disable_parallel_tool_use?: boolean;
}

/** Extended thinking 配置（Beta 功能） */
export interface Thinking {
  type: 'enabled';
  budget_tokens: number; // ≥1024 且 < max_tokens
}

/** 请求体结构 */
export interface MessagesRequest {
  model: string; // 模型 ID，如 "claude-3-7-sonnet-20250219"
  max_tokens?: number; // 最大生成 token 数
  temperature?: number; // 随机性控制 (0–1)
  top_p?: number; // nucleus 核采样
  top_k?: number; // top-k 采样
  stop_sequences?: string[]; // 自定义停止符列表
  stream?: boolean; // 是否启用 SSE 流式输出
  system?: string | ContentBlock[]; // 可选：系统提示，文本或内容块
  thinking?: Thinking; // 可选：Beta extended thinking
  tools?: ToolDefinition[]; // 工具注册
  tool_choice?: ToolChoice; // 工具调用策略
  messages: Message[]; // 对话历史
  metadata?: Record<string, any>; // 可选：附加元数据（如 user_id）
}

/** 响应主体结构 */
export interface MessagesResponse {
  id: string; // 回答消息唯一 ID
  type: 'message'; // 固定为 "message"
  model: string; // 使用模型名称
  role: 'assistant'; // 固定为 assistant
  content: ContentBlock[]; // 返回的多内容块数组
  stop_reason: string; // 停止原因 ("end_turn"/"stop_sequence"/"max_tokens"/"tool_use")
  stop_sequence: string | null; // 如果由 stop_sequence 停止，返回对应字符串

  usage?: {
    input_tokens: number; // 输入 tokens 数
    output_tokens: number; // 输出 tokens 数
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
    /** 可能返回 cache hit/miss 信息 */
  };
}
