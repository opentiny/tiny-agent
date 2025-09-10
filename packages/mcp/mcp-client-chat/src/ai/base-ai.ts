import type { ChatBody, ChatCompleteResponse } from '../types/index.js';

export abstract class BaseAi {
  abstract chat(chatBody: ChatBody): Promise<ChatCompleteResponse | Error>;

  abstract chatStream(chatBody: ChatBody): Promise<globalThis.ReadableStream<Uint8Array>>;
}
