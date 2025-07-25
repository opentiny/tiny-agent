import type { GenerateTextResult, LanguageModelV1, StreamTextResult, ToolSet } from 'ai';
import { generateText, streamText } from 'ai';
import type { LlmConfig } from '../../../type.js';
import type { GenerateTextOptions, ProviderTypeMap, StreamTextOptions } from './types.js';

export abstract class BaseProvider {
  llmConfig: LlmConfig;
  provider: ProviderTypeMap[keyof ProviderTypeMap];

  constructor(llmConfig: LlmConfig) {
    this.llmConfig = llmConfig;
    this.provider = this.getProvider();
  }

  abstract getProvider(): ProviderTypeMap[keyof ProviderTypeMap];

  abstract getModel(): LanguageModelV1;

  generateText(options: GenerateTextOptions): Promise<GenerateTextResult<ToolSet, unknown>> {
    try {
      const model = this.getModel();

      return generateText({
        model,
        ...options,
      });
    } catch (error) {
      console.error('Error calling generateText:', error);
      throw error;
    }
  }

  streamText(opts: StreamTextOptions): StreamTextResult<ToolSet, unknown> {
    try {
      const model = this.getModel();

      return streamText({
        model,
        ...opts,
      });
    } catch (error) {
      console.error('Error calling streamText:', error);
      throw error;
    }
  }
}
