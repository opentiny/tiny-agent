import { createOpenAI } from '@ai-sdk/openai';
import type { OpenAIProvider } from '@ai-sdk/openai';
import type { LanguageModelV1 } from 'ai';
import type { LlmConfig } from '../../../type.js';
import { BaseProvider } from './base-provider.js';

export class OpenAi extends BaseProvider {
  constructor(llmConfig: LlmConfig) {
    super(llmConfig);
  }

  getProvider(): OpenAIProvider {
    return createOpenAI({
      apiKey: this.llmConfig.apiKey,
      baseURL: this.llmConfig.url,
    });
  }

  getModel(): LanguageModelV1 {
    return (this.provider as OpenAIProvider)(this.llmConfig.model);
  }
}
