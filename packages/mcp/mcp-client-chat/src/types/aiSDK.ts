import type { generateText, streamText } from 'ai';
import type { LanguageModelV2 } from '@ai-sdk/provider';

export type GenerateTextOptions = Omit<Parameters<typeof generateText>[0], 'model'>;

export type StreamTextOptions = Omit<Parameters<typeof streamText>[0], 'model'>;

export type LanguageModel = string | LanguageModelV2;

export type { ModelMessage } from 'ai';