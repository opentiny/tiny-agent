import { generateText, streamText, tool } from 'ai';
import type {
  AssistantContent,
  ModelMessage,
  SystemModelMessage,
  UserModelMessage,
  AssistantModelMessage,
  ToolCallPart,
  ToolModelMessage,
  GenerateTextResult,
  StreamTextResult,
  ToolSet,
  UserContent,
  ToolResultPart,
} from 'ai';
import { BaseAi } from '../base-ai.js';
import type {
  ChatBody,
  ChatCompleteResponse,
  LlmConfig,
  GenerateTextOptions,
  StreamTextOptions,
  LanguageModel,
} from '../../types/index.js';
import { getDefaultModel } from './default-config.js';
import { jsonSchemaToZod, transformChatResult, toOpenAIChunk } from '../../utils/index.js';
import { transformMessagesToAiSdk } from './utils.js';

type AiSDKConfig = LlmConfig & { useSDK: true };

export class AiSDK extends BaseAi {
  model: LanguageModel;
  llmConfig: AiSDKConfig;

  constructor(llmConfig: AiSDKConfig) {
    super();
    this.llmConfig = llmConfig;
    this.model = llmConfig.model || getDefaultModel();
  }

  generateChatOptions(chatBody: ChatBody): GenerateTextOptions {
    const messages: ModelMessage[] = transformMessagesToAiSdk(chatBody.messages);

    const { model, systemPrompt, summarySystemPrompt, url, useSDK, apiKey, ...rest } = this.llmConfig;

    if (systemPrompt) {
      messages.unshift({ role: 'system', content: systemPrompt });
    }

    const chatOptions: GenerateTextOptions = { messages: messages || [], ...rest };

    if (typeof chatBody.temperature === 'number') {
      chatOptions.temperature = chatBody.temperature;
    }

    if (chatBody.tools?.length) {
      const tools: ToolSet = chatBody.tools.reduce((pre, cur) => {
        return {
          ...pre,
          [cur.function.name]: tool({
            description: cur.function.description,
            inputSchema: jsonSchemaToZod(cur.function.parameters),
          }),
        };
      }, {});

      chatOptions.tools = tools;
      chatOptions.toolChoice = 'auto';
    }

    return chatOptions;
  }

  async chat(chatBody: ChatBody): Promise<ChatCompleteResponse | Error> {
    try {
      const chatOptions = this.generateChatOptions(chatBody);
      const { messages, tools, toolChoice, prompt, ...rest } = chatOptions;
      const result: GenerateTextResult<ToolSet, unknown> = await generateText({
        model: this.model,
        messages: messages || [],
        ...(tools && { tools }),
        ...(toolChoice && { toolChoice }),
        ...rest,
      });

      const response: ChatCompleteResponse = transformChatResult(result, this.llmConfig.model);

      return response;
    } catch (error) {
      console.error(error);
      return new Error(error instanceof Error ? error.message : 'An unexpected error occurred during chat');
    }
  }

  async chatStream(chatBody: ChatBody): Promise<globalThis.ReadableStream<Uint8Array>> {
    try {
      const chatOptions: StreamTextOptions = this.generateChatOptions(chatBody);
      const model = (chatBody as any).model ?? this.model;
      const { messages, tools, toolChoice, prompt, ...rest } = chatOptions;
      const result: StreamTextResult<ToolSet, unknown> = streamText({
        model,
        messages: messages || [],
        ...(tools && { tools }),
        ...(toolChoice && { toolChoice }),
        ...rest,
      });
      const iterator = this.openaiChunkGenerator(result, model);

      return new ReadableStream<Uint8Array>({
        async pull(controller) {
          try {
            const { value, done } = await iterator.next();
            if (done) {
              controller.close();
            } else {
              controller.enqueue(value);
            }
          } catch (err) {
            const encoder = new TextEncoder();
            const errorMessage = err instanceof Error ? err.message : 'Stream failed';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        },
      });
    } catch (error) {
      console.error(error);

      const errorMessage = error instanceof Error ? error.message : 'Stream failed';

      return new ReadableStream<Uint8Array>({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
    }
  }

  async *openaiChunkGenerator(
    result: StreamTextResult<ToolSet, unknown>,
    model: LanguageModel = this.model,
  ): AsyncGenerator<Uint8Array> {
    const encoder = new TextEncoder();
    for await (const chunk of result.fullStream) {
      const data = toOpenAIChunk(chunk, model);

      yield encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
    }
    yield encoder.encode('data: [DONE]\n\n');
  }
}
