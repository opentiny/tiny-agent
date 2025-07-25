import type { ChatBody, ChatCompleteResponse, LlmConfig } from '../../type.js';
import { BaseAi } from '../base-ai.js';

export class AiRestApi extends BaseAi {
  constructor(llmConfig: LlmConfig) {
    super(llmConfig);
  }

  async chat(chatBody: ChatBody): Promise<ChatCompleteResponse | Error> {
    const { url, apiKey } = this.llmConfig;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
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

  async chatStream(chatBody: ChatBody): Promise<globalThis.ReadableStream> {
    const { url, apiKey } = this.llmConfig;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stream: true, ...chatBody }),
      });

      if (!response.ok) {
        // 获取详细的错误信息
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}\nError details: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      return response.body;
    } catch (error) {
      console.error('Error calling streaming chat/complete:', error);

      throw new Error(`Streaming chat API call failed: ${String(error)}`);
    }
  }
}
