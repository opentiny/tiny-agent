import type { ChatBody, ChatCompleteResponse, LlmConfig } from '../type.js';

/**
 * AI 提供者基础接口
 * 所有 AI 提供者都必须实现这个接口
 */
export interface BaseAIProvider {
  /**
   * 提供者名称
   */
  readonly name: string;

  /**
   * 处理聊天请求（非流式）
   */
  chat(request: ChatBody): Promise<ChatCompleteResponse>;

  /**
   * 处理聊天请求（流式）
   */
  chatStream(request: ChatBody): AsyncGenerator<ChatCompleteResponse>;

  /**
   * 获取配置信息
   */
  getConfig?(config: LlmConfig): Record<string, any>;

  /**
   * 更新配置
   */
  updateConfig(config: Partial<Record<string, any>>): void;

  /**
   * 检查配置是否有效
   */
  validateConfig(): boolean;

  /**
   * 获取支持的模型列表
   */
  getSupportedModels(): string[];

  /**
   * 检查模型是否支持
   */
  isModelSupported(model: string): boolean;
}

export enum ProviderType {
  OpenAI = 'openai',
  AnthropicAI = 'anthropic',
}

/**
 * AI 提供者配置基础接口
 */
export interface BaseProviderConfig {
  // 提供者类型
  type: ProviderType;
  // 提供者名称
  name: string;
}
