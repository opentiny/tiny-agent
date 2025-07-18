import type { ChatCompleteRequest } from '../type.js';

export abstract class BaseAIInstance {
  // protected abstract chat(request: ChatCompleteRequest): Promise<ChatCompleteResponse | Error>;

  protected abstract chat(request: ChatCompleteRequest): Promise<globalThis.ReadableStream>;
}
