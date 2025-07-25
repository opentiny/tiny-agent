import type { ChatBody, ChatCompleteResponse, LlmConfig } from '@/type.js';

export abstract class BaseAi {
  llmConfig: LlmConfig;

  constructor(llmConfig: LlmConfig) {
    this.llmConfig = llmConfig;
  }

  abstract chat(chatBody: ChatBody): Promise<ChatCompleteResponse | Error>;

  abstract chatStream(chatBody: ChatBody): Promise<globalThis.ReadableStream>;
}
