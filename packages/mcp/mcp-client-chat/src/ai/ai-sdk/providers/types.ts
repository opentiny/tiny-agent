import type { generateText, streamText } from 'ai';
import type { DeepSeekProvider } from '@ai-sdk/deepseek';
import type { OpenAIProvider } from '@ai-sdk/openai';
import type { OpenRouterProvider } from '@openrouter/ai-sdk-provider';
import type { AnthropicProviderType } from './anthropic.js';
import type { providers } from './providers.js';

export type ProviderName = keyof typeof providers;

export type GenerateTextOptions = Omit<Parameters<typeof generateText>[0], 'model'>;

export type StreamTextOptions = Omit<Parameters<typeof streamText>[0], 'model'>;

export type Provider = (typeof providers)[ProviderName];

export type ProviderInstance = InstanceType<Provider>;

export type ProviderTypeMap = {
  anthropic: AnthropicProviderType;
  deepseek: DeepSeekProvider;
  openai: OpenAIProvider;
  openrouter: OpenRouterProvider;
};
