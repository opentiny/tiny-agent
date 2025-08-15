import { createOpenAI, openai } from '@ai-sdk/openai';
import type { OpenAIProviderSettings } from '@ai-sdk/openai';
import type { LlmConfig } from '../../types/index.js';

export const getDefaultProvider = (llmConfig: LlmConfig) => {
  const options: OpenAIProviderSettings = {
    apiKey: llmConfig.apiKey || process.env.OPENAI_API_KEY,
    baseURL: llmConfig.url,
  };

  if (llmConfig.headers) {
    options.headers = llmConfig.headers as Record<string, string>;
  }

  return createOpenAI(options);
};

export const getDefaultModel = (provider: ReturnType<typeof createOpenAI> = openai) => {
  return provider('deepseek-chat');
};
