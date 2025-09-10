import { tool } from 'ai';
import type { ModelMessage, GenerateTextResult, StreamTextResult, TextStreamPart, ToolSet } from 'ai';
import { BaseAi } from '../base-ai.js';
import { Role } from '../../type.js';
import type { ChatBody, ChatCompleteResponse, LlmConfig, StreamingChoice, Message } from '../../type.js';
import { jsonSchemaToZod } from '../../utils/index.js';
import { providers } from './providers/index.js';
import type { GenerateTextOptions, Provider, ProviderInstance, StreamTextOptions } from './providers/index.js';
import { logger } from '../../logger/index.js';
import { transformMessagesToAiSdk } from './utils.js';

export class AiSDK extends BaseAi {
  provider: ProviderInstance;

  constructor(llmConfig: LlmConfig) {
    super(llmConfig);

    const { provider = 'openai' } = this.llmConfig;

    if (!(provider in providers)) {
      throw new Error(`Invalid provider: ${provider}`);
    }

    const ProviderConstructor: Provider = providers[provider as keyof typeof providers];

    this.provider = new ProviderConstructor(this.llmConfig);
  }

  generateChatOptions(chatBody: ChatBody): GenerateTextOptions {
    const openAiMessages: Message[] = chatBody.messages;
    const messages: ModelMessage[] = transformMessagesToAiSdk(openAiMessages);
    const { model, provider, systemPrompt, summarySystemPrompt, url, useSDK, apiKey, ...rest } = this.llmConfig;

    if (provider === 'openai' && systemPrompt) {
      messages.unshift({ role: 'system', content: systemPrompt });
    }

    const chatOptions: GenerateTextOptions = { messages, ...rest };

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
      const result: GenerateTextResult<ToolSet, unknown> = await this.provider.generateText(chatOptions);
      const response: ChatCompleteResponse = {
        id: '',
        created: Date.now(),
        object: 'chat.completion',
        model: this.llmConfig.model,
        choices: [
          {
            message: {
              role: Role.ASSISTANT,
              content: result.text,
              tool_calls: result.toolCalls.map((toolCall) => ({
                id: toolCall.toolCallId,
                type: 'function',
                function: {
                  name: toolCall.toolName,
                  arguments: JSON.stringify(toolCall.input),
                },
              })),
            },
            finish_reason: result.finishReason,
            native_finish_reason: result.finishReason,
          },
        ],
      };

      if (result.usage) {
        response.usage = {
          prompt_tokens: result.usage.inputTokens || 0,
          completion_tokens: result.usage.outputTokens || 0,
          total_tokens: result.usage.totalTokens || 0,
        };
      }

      return response;
    } catch (error) {
      logger.error(error);

      return error as Error;
    }
  }

  async chatStream(chatBody: ChatBody): Promise<globalThis.ReadableStream> {
    try {
      const chatOptions: StreamTextOptions = this.generateChatOptions(chatBody);
      const result: StreamTextResult<ToolSet, unknown> = this.provider.streamText(chatOptions);
      const iterator = this.openaiChunkGenerator(result);

      return new ReadableStream<Uint8Array>({
        async pull(controller) {
          const { value, done } = await iterator.next();
          if (done) {
            controller.close();
          } else {
            controller.enqueue(value);
          }
        },
      });
    } catch (error) {
      logger.error(error);

      throw error;
    }
  }

  async *openaiChunkGenerator(result: StreamTextResult<ToolSet, unknown>): AsyncGenerator<Uint8Array> {
    const encoder = new TextEncoder();
    for await (const chunk of result.fullStream) {
      const data = this.convertToStandardChunk(chunk);

      yield encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
    }
    yield encoder.encode('data: [DONE]\n\n');
  }

  convertToStandardChunk(chunk: TextStreamPart<ToolSet>): ChatCompleteResponse {
    const choice: StreamingChoice = {
      finish_reason: '',
      native_finish_reason: '',
      delta: {
        content: '',
        role: Role.ASSISTANT,
      },
    };
    const result: ChatCompleteResponse = {
      id: 'id' in chunk ? chunk.id : '',
      created: 0,
      object: 'chat.completion.chunk',
      model: this.llmConfig.model,
      choices: [choice],
    };

    switch (chunk.type) {
      case 'tool-call':
        choice.delta.tool_calls = [
          {
            id: chunk.toolCallId,
            type: 'function',
            function: {
              name: chunk.toolName,
              arguments: JSON.stringify(chunk.input),
            },
          },
        ];
        break;
      case 'text-delta':
        choice.delta.content = chunk.text;
        break;
      case 'finish':
        choice.finish_reason = chunk.finishReason;
        choice.native_finish_reason = chunk.finishReason;
        result.usage = {
          prompt_tokens: chunk.totalUsage.inputTokens || 0,
          completion_tokens: chunk.totalUsage.outputTokens || 0,
          total_tokens: chunk.totalUsage.totalTokens || 0,
        };
        break;
      default:
        break;
    }

    return result;
  }
}
