import { LlmConfig } from '../../type.js';

export class AiRESTInstance {
  config: LlmConfig;

  constructor(config: LlmConfig) {
    this.config = config;
  }

  protected async queryChatComplete(): Promise<ChatCompleteResponse | Error> {
    const { baseURL, apiKey } = this.options.llmConfig;
    const chatBody = await this.getChatBody();

    try {
      const response = await fetch(baseURL, {
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

  protected async queryChatCompleteStreaming(): Promise<ReadableStream> {
    const { baseURL, apiKey } = this.options.llmConfig;
    const chatBody = await this.getChatBody();

    try {
      const response = await fetch(baseURL, {
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
    } finally {
      // TODO: Implement context memory feature, for now clear after each request
      this.clearPromptMessages();
    }
  }
}
