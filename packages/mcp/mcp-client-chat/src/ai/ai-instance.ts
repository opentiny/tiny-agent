import type { LlmConfig } from '../type.js';
import type { BaseAi } from './base-ai.js';
import { AiSDK } from './ai-sdk/ai-sdk.js';
import { AiRestApi } from './ai-rest-api/ai-rest-api.js';

export function getAiInstance(llmConfig: LlmConfig): BaseAi {
  if (llmConfig.useSDK) {
    return new AiSDK(llmConfig);
  }

  return new AiRestApi(llmConfig);
}
