// 消息角色类型（与 OpenAI 类似）
export type Role = 'system' | 'user' | 'assistant' | 'tool';

// 单条消息结构
export interface ChatMessage {
  role: Role; // 消息的角色
  content: string; // 消息内容
  name?: string; // 可选：当 role 为 tool/function 时，工具名称
  tool_call_id?: string; // 可选：关联特定工具调用的 ID
}

export interface ToolFunctionProperty {
  type: string;
  description: string;
  enum?: string[];
}

export interface ToolFunctionParameters {
  type: 'object';
  properties: Record<string, ToolFunctionProperty>;
  required?: string[];
}

// 工具定义（仅在 stream=false 时支持）
export interface ToolDefinition {
  type: 'function'; // 工具类型，目前仅支持 "function"
  function: {
    name: string; // 函数名称（唯一标识）
    description?: string; // 描述信息（供模型参考）
    parameters: ToolFunctionParameters; // JSON Schema 格式的参数结构
  };
}


// 工具选择策略（用于限定模型调用哪个工具）
export interface ToolChoice {
  type: 'function'; // 固定为 function
  function: {
    name: string; // 指定的函数名称
  };
}

export interface OllamaChatCreateParams {
  model: string; // 模型名称（如 "llama3", "mistral" 等）
  messages: ChatMessage[]; // 聊天上下文消息数组（支持多轮）

  stream?: boolean; // 是否开启流式响应（默认 false）

  tools?: ToolDefinition[]; // 可选：注册的工具函数（仅 stream = false 时可用）
  tool_choice?: 'none' | 'auto' | ToolChoice; // 工具调用策略：自动、禁用或指定某个工具

  format?: string; // 输出格式，可设为 "json"（结构化输出）
  keep_alive?: string; // 模型上下文保持时间，如 "30s", "5m", "1h"（超时销毁）

  // 推理选项（多数与 OpenAI 参数类似）
  options?: {
    temperature?: number; // 温度，控制输出多样性（0-2）
    seed?: number; // 随机种子，设定后结果可复现
    top_k?: number; // 采样限制：选择 top_k 个最高概率词
    top_p?: number; // 样本概率累计阈值（通常为 0.8-1.0）
    tfs_z?: number; // TFS 采样参数（较少使用）
    typical_p?: number; // 典型采样参数
    repeat_penalty?: number; // 重复惩罚，降低重复内容
    presence_penalty?: number; // 出现惩罚，鼓励新话题
    frequency_penalty?: number; // 频率惩罚，限制高频词
    mirostat?: number; // 启用 mirostat（0=禁用，1/2=不同模式）
    mirostat_tau?: number; // mirostat 控制目标困惑度
    mirostat_eta?: number; // mirostat 学习率
    penalize_newline?: boolean; // 是否惩罚换行符（默认 false）
    stop?: string[]; // 停止词（数组形式）
    num_predict?: number; // 限制生成 token 数量
    [key: string]: any; // 允许附加自定义参数
  };
}

/* -- response -- */
// 工具调用结构（与 OpenAI 类似）
export interface ToolCall {
  id: string; // 工具调用 ID，用于匹配请求与响应
  type: 'function'; // 当前只支持 function
  function: {
    name: string; // 函数名称
    arguments: string; // 函数参数（JSON 字符串）
  };
}

// 返回的消息结构
export interface Message {
  role: Role; // 消息角色，如 assistant/user/system/tool
  content: string; // 文本内容
  name?: string; // 可选：函数或工具名称
  tool_calls?: ToolCall[]; // 可选：模型发起的工具调用（多调用）
  images?: (string | Uint8Array)[]; // 可选：图像输入（base64 或二进制）
}

// 主体返回结构
export interface ChatResponse {
  model: string; // 模型名称，如 "llama3", "mistral"
  created_at: string; // 响应创建时间，ISO 时间戳字符串
  message: Message; // 返回的 assistant 消息内容
  done: boolean; // 是否完成（用于兼容 stream 模式）
  done_reason: 'stop' | 'length' | string; // 停止原因：stop（自然结束）、length（超长）等

  total_duration: number; // 总耗时（单位：纳秒）
  load_duration: number; // 加载模型耗时（单位：纳秒）
  prompt_eval_count: number; // 提示词评估的 token 数
  prompt_eval_duration: number; // 提示词评估耗时（单位：纳秒）
  eval_count: number; // 生成 token 数量
  eval_duration: number; // 生成耗时（单位：纳秒）

  context?: any; // 可选：上下文 ID（用于持续对话）
}
