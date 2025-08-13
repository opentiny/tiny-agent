import type { LlmConfig } from '../../types/index.js';
import { createOpenAI, OpenAIProviderSettings, openai } from '@ai-sdk/openai';

export const getDefaultProvider = (llmConfig: LlmConfig) => {
  const options: OpenAIProviderSettings = {
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.url,
  };

  if (llmConfig.headers) {
    options.headers = llmConfig.headers as Record<string, string>;
  }

  return createOpenAI(options);
};

export const getDefaultModel = () => {
  return openai('deepseek-chat');
};
