import type { ChatBody, ChatCompleteResponse, LlmConfig } from '../../types/index.js';
import { Role } from '../../types/index.js';
import { BaseAi } from '../base-ai.js';

type AiRestApiConfig = Extract<LlmConfig, { useSDK?: false | undefined; url: string; apiKey: string; model: string }>;

export class AiRestApi extends BaseAi {
  llmConfig: AiRestApiConfig;

  constructor(llmConfig: AiRestApiConfig) {
    super();

    this.llmConfig = llmConfig;
  }

  async chat(chatBody: ChatBody): Promise<ChatCompleteResponse | Error> {
    const { url, apiKey } = this.llmConfig;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(this.llmConfig.headers ?? {}),
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatBody),
      });
      if (!response.ok) {
        return new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }

      return (await response.json()) as ChatCompleteResponse;
    } catch (error) {
      console.error('Error calling chat/complete:', error);

      return error as Error;
    }
  }

  async chatStream(chatBody: ChatBody): Promise<globalThis.ReadableStream<Uint8Array>> {
    const { url, apiKey } = this.llmConfig;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(this.llmConfig.headers ?? {}),
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...chatBody, stream: true }),
      });

      if (!response.body) {
        return this.generateErrorStream('Response body is empty!');
      }

      if (!response.ok) {
        // 获取详细的错误信息
        const errorText = await response.text();
        const errorMessage = `Failed to call chat API! ${errorText}`;
        console.error('Failed to call chat API:', errorMessage);
        return this.generateErrorStream(errorMessage);
      }

      return response.body;
    } catch (error) {
      console.error('Failed to call streaming chat/complete:', error);

      return this.generateErrorStream(`Failed to call chat API! ${error}`);
    }
  }

  protected generateErrorStream(errorMessage: string): ReadableStream<Uint8Array> {
    const errorResponse: ChatCompleteResponse = {
      id: `chat-error-${Date.now()}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: this.llmConfig.model,
      choices: [
        {
          finish_reason: 'error',
          native_finish_reason: 'error',
          delta: {
            role: Role.ASSISTANT,
            content: errorMessage,
          },
        },
      ],
    };
    const data = `data: ${JSON.stringify(errorResponse)}\n\n`;
    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(data));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
  }
}
