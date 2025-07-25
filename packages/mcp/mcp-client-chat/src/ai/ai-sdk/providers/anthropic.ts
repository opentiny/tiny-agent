import { createAnthropic } from '@ai-sdk/anthropic';
import type { AnthropicProvider } from '@ai-sdk/anthropic';
import type { LanguageModelV1 } from 'ai';
import type { LlmConfig } from '../../../type.js';
import { BaseProvider } from './base-provider.js';

export class Anthropic extends BaseProvider {
  constructor(llmConfig: LlmConfig) {
    super(llmConfig);
  }

  getProvider(): AnthropicProvider {
    return createAnthropic({
      apiKey: this.llmConfig.apiKey,
      baseURL: this.llmConfig.url,
    });
  }

  getModel(): LanguageModelV1 {
    return (this.provider as AnthropicProvider)(this.llmConfig.model);
  }
}

export type AnthropicProviderType = AnthropicProvider;
