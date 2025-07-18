import type { ChatBody, ChatCompleteResponse, LlmConfig } from '../../type.js';
import { BaseAIInstance } from '../base-ai-instance.js';
import { ProviderType } from './types.js';
import type { BaseAIProvider, BaseProviderConfig } from './types.js';
// import { AnthropicAIProvider } from './providers/anthropic/index.js';
import { OpenAIProvider } from './providers/openai/index.js';
import { providerConfigs } from './providers/providerConfigs.js';

/**
 * AI SDK实例
 */
export class AiSDKInstance extends BaseAIInstance {
  private providers = new Map<string, BaseAIProvider>();
  private defaultProvider: string | null = null;

  constructor(llmConfig: LlmConfig) {
    super();
    this.initProviders(llmConfig);
  }

  /**
   * 初始化所有provider
   */
  initProviders(llmConfig: LlmConfig) {
    providerConfigs.forEach((provider) => {
      this.createProvider(provider, llmConfig);
    });
  }
  /**
   * 创建并注册 AI 提供者
   */
  createProvider(config: BaseProviderConfig, llmConfig: LlmConfig) {
    let provider = null;

    switch (config.type) {
      case ProviderType.OpenAI:
        provider = new OpenAIProvider(llmConfig);
        break;
      // case ProviderType.AnthropicAI:
      //   provider = new AnthropicAIProvider(llmConfig);
      //   break;
      default:
        provider = new OpenAIProvider(llmConfig);
    }

    this.providers.set(config.name, provider);

    // 如果没有默认提供者，设置为第一个
    if (!this.defaultProvider) {
      this.defaultProvider = config.name;
    }

    return provider;
  }

  /**
   * 获取提供者实例
   */
  getProvider(name: string): BaseAIProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * 获取默认提供者
   */
  getDefaultProvider(): BaseAIProvider | undefined {
    if (!this.defaultProvider) {
      return undefined;
    }
    return this.providers.get(this.defaultProvider);
  }

  /**
   * 设置默认提供者
   */
  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`提供者不存在: ${name}`);
    }
    this.defaultProvider = name;
  }

  /**
   * 移除提供者
   */
  removeProvider(name: string): boolean {
    const removed = this.providers.delete(name);

    // 如果移除的是默认提供者，重新设置默认提供者
    if (removed && this.defaultProvider === name) {
      this.defaultProvider = this.providers.keys().next().value || null;
    }

    return removed;
  }

  /**
   * 获取所有提供者名称
   */
  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 获取支持的提供者列表
   */
  getSupportedProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 检查提供者是否支持
   */
  isProviderSupported(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * 检查提供者是否已创建
   */
  isProviderCreated(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * 统一聊天接口（使用默认提供者）
   */
  async chat(request: ChatBody): Promise<globalThis.ReadableStream> {
    const provider = this.getDefaultProvider();
    if (!provider) {
      throw new Error('没有可用的 AI 提供者');
    }
    return provider.chat(request);
  }

  /**
   * 统一流式聊天接口（使用默认提供者）
   */
  async *chatStream(request: ChatBody): AsyncGenerator<ChatCompleteResponse> {
    const provider = this.getDefaultProvider();
    if (!provider) {
      throw new Error('没有可用的 AI 提供者');
    }
    yield* provider.chatStream(request);
  }

  /**
   * 使用指定提供者聊天
   */
  async chatWithProvider(providerName: string, request: ChatBody): Promise<ChatCompleteResponse> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`提供者不存在: ${providerName}`);
    }
    return provider.chat(request);
  }

  /**
   * 使用指定提供者流式聊天
   */
  async *chatStreamWithProvider(providerName: string, request: ChatBody): AsyncGenerator<ChatCompleteResponse> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`提供者不存在: ${providerName}`);
    }
    yield* provider.chatStream(request);
  }

  /**
   * 更新提供者配置
   */
  updateProviderConfig(providerName: string, config: Partial<Record<string, any>>): void {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`提供者不存在: ${providerName}`);
    }
    provider.updateConfig(config);
  }

  /**
   * 验证所有提供者配置
   */
  validateAllConfigs(): Record<string, boolean> {
    const results: Record<string, boolean> = {};
    for (const [name, provider] of this.providers) {
      results[name] = provider.validateConfig();
    }
    return results;
  }

  /**
   * 获取所有提供者支持的模型
   */
  getAllSupportedModels(): Record<string, string[]> {
    const models: Record<string, string[]> = {};
    for (const [name, provider] of this.providers) {
      models[name] = provider.getSupportedModels();
    }
    return models;
  }
}
