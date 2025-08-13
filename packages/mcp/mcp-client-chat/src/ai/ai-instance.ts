import type { LlmConfig } from '../types/index.js';
import type { BaseAi } from './base-ai.js';

export async function getAiInstance(llmConfig: LlmConfig): Promise<BaseAi> {
  if (llmConfig.useSDK) {
    const { AiSDK } = await import('./ai-sdk/ai-sdk.js');
    return new AiSDK(llmConfig);
  }

  const { AiRestApi } = await import('./ai-rest-api/ai-rest-api.js');
  return new AiRestApi(llmConfig);
}
