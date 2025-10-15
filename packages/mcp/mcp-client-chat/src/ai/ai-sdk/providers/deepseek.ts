import { createDeepSeek } from '@ai-sdk/deepseek';
import type { DeepSeekProvider } from '@ai-sdk/deepseek';
import type { LanguageModel } from 'ai';
import type { LlmConfig } from '../../../type.js';
import { BaseProvider } from './base-provider.js';

export class DeepSeek extends BaseProvider {
  constructor(llmConfig: LlmConfig) {
    super(llmConfig);
  }

  getProvider(): DeepSeekProvider {
    return createDeepSeek({
      apiKey: this.llmConfig.apiKey,
      baseURL: this.llmConfig.url,
    });
  }

  getModel(): LanguageModel {
    return (this.provider as DeepSeekProvider)(this.llmConfig.model);
  }
}

export type DeepSeekProviderType = DeepSeekProvider;
