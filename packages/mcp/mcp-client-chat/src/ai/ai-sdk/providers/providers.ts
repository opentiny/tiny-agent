import { Anthropic } from './anthropic.js';
import { DeepSeek } from './deepseek.js';
import { OpenAi } from './openai.js';
import { OpenRouter } from './openrouter.js';

export const providers = {
  anthropic: Anthropic,
  deepseek: DeepSeek,
  openai: OpenAi,
  openrouter: OpenRouter,
} as const;
