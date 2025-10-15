import { type OpenRouterProvider, createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';
import type { LlmConfig } from '../../../type.js';
import { BaseProvider } from './base-provider.js';

export class OpenRouter extends BaseProvider {
  constructor(llmConfig: LlmConfig) {
    super(llmConfig);
  }

  getProvider(): OpenRouterProvider {
    return createOpenRouter({
      apiKey: this.llmConfig.apiKey,
      baseURL: this.llmConfig.url,
    });
  }

  getModel(): LanguageModel {
    return (this.provider as OpenRouterProvider).chat(this.llmConfig.model) as unknown as LanguageModel;
  }
}
