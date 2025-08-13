import type { ChatBody, ChatCompleteResponse, LlmConfig } from '../../types/index.js';
import { Role } from '../../types/index.js';
import { BaseAi } from '../base-ai.js';

type AiRestApiConfig = LlmConfig & { useSDK?: false };

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


    // const { url, apiKey } = this.llmConfig;

    // try {
    //   const response = await fetch(url, {
    //     method: 'POST',
    //     headers: {
    //       Authorization: `Bearer ${apiKey}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({ stream: true, ...chatBody }),
    //   });

    //   if (!response.ok) {
    //     // 获取详细的错误信息
    //     const errorText = await response.text();
    //     console.error('API Error Response:', errorText);
    //     throw new Error(`HTTP error! status: ${response.status}\nError details: ${errorText}`);
    //   }

    //   if (!response.body) {
    //     throw new Error('Response body is null');
    //   }

    //   return response.body;
    // } catch (error) {
    //   console.error('Error calling streaming chat/complete:', error);

    //   throw new Error(`Streaming chat API call failed: ${String(error)}`);
    // }
  }

  protected generateErrorStream(errorMessage: string) {
    const errorResponse: ChatCompleteResponse = {
      id: `chat-error-${Date.now()}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: this.llmConfig.model as string,
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
    const data = `data: ${JSON.stringify(errorResponse)}\n`;

    return new ReadableStream({
      start(controller) {
        controller.enqueue(data);
        controller.enqueue('data: [DONE]\n');
        controller.close();
      },
    });
  }
}
