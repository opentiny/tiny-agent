import type { AvailableTool, Message, Role } from '../../../../type.js';

export interface OpenAIConfig {
  /**
   * 默认用于所有请求的 API Key。
   * 如果不传，SDK 会尝试从环境变量 process.env.OPENAI_API_KEY 中读取。
   */
  apiKey?: string;

  /**
   * 默认用于所有请求的组织 ID。
   * 只有当你的账号属于多个组织时需要填写。
   */
  organization?: string;

  /**
   * 用于覆盖默认的 OpenAI API 请求地址。
   * 例如：
   * - 自定义代理地址
   * - 使用 OpenRouter 等兼容平台
   * 默认是 "https://api.openai.com/v1"
   */
  baseURL?: string;

  /**
   * 为所有请求附加额外的 HTTP Headers。
   * 常用于：
   * - 自定义认证
   * - 日志追踪
   * - 平台识别
   */
  defaultHeaders?: HeadersInit;

  /**
   * HTTP 请求超时时间（毫秒）。
   */
  timeout?: number;

  /**
   * 自定义 fetch 实现，用于替代默认的 fetch。
   * 常用于：
   * - Node.js 环境下没有原生 fetch 时
   * - 在请求中增加自定义逻辑（例如日志、拦截器）
   */
  fetch?: typeof fetch | undefined;
}

export interface OpenAIChatRequest {
  messages: Message[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  tools?: AvailableTool[];
  stream?: boolean;
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

export interface OpenAIChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIChatStreamResponse {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: Role;
      content?: string | null;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string | null;
  }>;
}
