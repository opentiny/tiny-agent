/* -- request -- */
// openai-chat-request.d.ts

export type Role = 'system' | 'user' | 'assistant' | 'tool' | 'function';

// 聊天消息结构
export interface ChatMessage {
  role: Role; // 消息角色：system/user/assistant/tool/function
  content: string | null; // 消息文本内容
  name?: string; // 可选：用于 function/tool 调用场景
  tool_call_id?: string; // 可选：标识某个工具调用（通常由模型生成）
}

export interface ToolFunctionProperty {
  type: string;
  description: string;
}

export interface ToolFunctionParameters {
  type: 'object';
  properties: Record<string, ToolFunctionProperty>;
  required?: string[];
}

// 工具（函数）定义
export interface ToolDefinition {
  type: 'function'; // 工具类型，目前仅支持 "function"
  function: {
    name: string; // 函数名称（唯一标识）
    description?: string; // 描述信息（供模型参考）
    parameters: ToolFunctionParameters; // JSON Schema 格式的参数结构
  };
}

// 指定要调用的工具（可选）
export interface ToolChoice {
  type: 'function'; // 固定为 function
  function: {
    name: string; // 函数名称
  };
}

// 请求参数结构
export interface ChatCompletionCreateParams {
  model: string; // 模型名称（如 "gpt-4", "gpt-4o", "gpt-3.5-turbo"）
  messages: ChatMessage[]; // 聊天上下文消息（包括用户和 assistant 消息）

  temperature?: number; // 控制输出多样性（0-2，默认 1）
  top_p?: number; // 采样多样性控制（通常与 temperature 二选一使用）
  n?: number; // 返回多少个候选回复（默认 1）
  stream?: boolean; // 是否开启流式响应（默认为 false）
  stop?: string | string[]; // 停止生成的触发符
  max_tokens?: number; // 限制输出最大 token 数
  presence_penalty?: number; // 惩罚模型重复话题（-2 ~ 2）
  frequency_penalty?: number; // 惩罚高频 token（-2 ~ 2）
  logit_bias?: Record<string, number>; // 对某些 token 的生成概率进行调整
  user?: string; // 终端用户唯一标识（用于监控滥用行为）

  tools?: ToolDefinition[]; // 工具列表（function 调用定义）
  tool_choice?: 'none' | 'auto' | ToolChoice; // 工具调用策略

  response_format?: 'text' | 'json_object'; // 指定返回格式（如结构化 JSON）
  seed?: number; // 随机种子，用于复现响应
  logprobs?: boolean; // 是否返回 token 级别的概率
  top_logprobs?: number; // 返回每个 token 的 top N 可能选项
}

/* -- response -- */
// 工具调用结构
export interface ToolCall {
  id: string; // 工具调用 ID
  type: 'function'; // 当前只支持 function 类型
  function: {
    name: string; // 函数名称
    arguments: string; // JSON 字符串格式的参数
  };
}

// 单条聊天消息结构
export interface ChatMessage {
  role: Role; // 消息角色
  content: string | null; // 文本内容
  tool_calls?: ToolCall[]; // assistant 触发的工具调用（可选）
  function_call?: {
    // legacy function_call 格式（已被 tool_calls 替代）
    name: string;
    arguments: string;
  };
}

// 返回的每一条候选回答（一个 completion 可能含多个）
export interface ChatCompletionChoice {
  index: number; // 候选编号（从 0 开始）
  message: ChatMessage; // assistant 回复内容
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'function_call' | 'content_filter' | null;
}

// token 使用情况
export interface Usage {
  prompt_tokens: number; // 输入 token 数量
  completion_tokens: number; // 模型生成的 token 数量
  total_tokens: number; // 总共消耗的 token 数量
}

export interface ChatCompletionResponse {
  id: string; // completion ID（唯一标识）
  object: 'chat.completion'; // 固定为 chat.completion
  created: number; // 时间戳（秒）
  model: string; // 模型名称
  choices: ChatCompletionChoice[]; // 返回的多个回答选择
  usage?: Usage; // token 使用统计（有时 stream 模式中不返回）
  system_fingerprint?: string; // 模型系统版本指纹（可用于缓存等用途）
}
