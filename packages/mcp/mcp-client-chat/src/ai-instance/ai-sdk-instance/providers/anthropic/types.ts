import type { AvailableTool, Role } from '../../../../type.js';

export interface AnthropicChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content:
      | string
      | Array<{
          type: 'text' | 'image';
          text?: string;
          source?: {
            type: 'base64';
            media_type: string;
            data: string;
          };
        }>;
  }>;
  model: string;
  temperature?: number;
  max_tokens?: number;
  tools?: AvailableTool[];
  stream?: boolean;
}

export interface AnthropicChatResponse {
  id: string;
  type: 'message';
  role: Role;
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface AnthropicChatStreamResponse {
  type: 'content_block_delta' | 'message_delta' | 'message_stop';
  index?: number;
  delta?: {
    type: 'text_delta';
    text: string;
  };
  usage?: {
    output_tokens: number;
  };
}

// Anthropic 官方 SDK 构造函数参数类型（参考 https://github.com/anthropics/anthropic-sdk-typescript/blob/main/api.md ）
export interface AnthropicClientOptions {
  /**
   * 用于请求 Anthropic API 的 API Key。
   * 默认也可以通过环境变量 ANTHROPIC_API_KEY 自动读取。
   */
  apiKey?: string;

  /**
   * 用于覆盖默认 API 地址。
   * 默认是：https://api.anthropic.com/v1
   * 常用于代理、自建代理网关或测试环境。
   */
  baseURL?: string;

  /**
   * 请求重试次数。
   * 默认值：2
   */
  maxRetries?: number;

  /**
   * 每个 HTTP 请求的超时时间（毫秒）。
   * 默认值：60000
   */
  timeout?: number;

  /**
   * 自定义 fetch 实现。
   * 可在 Node.js 环境或浏览器里用于注入自定义 fetch。
   */
  fetch?: Fetch | undefined;
}
