import { tool } from 'ai';
import type { CoreMessage, CoreToolMessage, GenerateTextResult, StreamTextResult, TextStreamPart, ToolSet } from 'ai';
import { BaseAi } from '../base-ai.js';
import { Role } from '../../type.js';
import type { ChatBody, ChatCompleteResponse, LlmConfig, StreamingChoice } from '../../type.js';
import { jsonSchemaToZod } from '../../utils/index.js';
import { providers } from './providers/index.js';
import type { GenerateTextOptions, Provider, ProviderInstance, StreamTextOptions } from './providers/index.js';
import { logger } from '../../logger/index.js';

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
    const messages: CoreMessage[] = chatBody.messages
      .map((msg) => {
        if (msg.role === 'user') {
          return { role: 'user', content: msg.content };
        }
        if (msg.role === 'assistant') {
          if (msg.tool_calls) {
            return {
              role: 'assistant',
              content: msg.tool_calls.map((toolCall) => ({
                type: 'tool-call',
                toolCallId: toolCall.id,
                toolName: toolCall.function.name,
                args: JSON.parse(toolCall.function.arguments),
              })),
            };
          }

          return { role: 'assistant', content: msg.content };
        }
        if (msg.role === 'system') {
          return { role: 'system', content: msg.content };
        }
        if (msg.role === 'tool') {
          return {
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId: msg.tool_call_id,
                toolName: msg.name,
                result: msg.content,
              },
            ],
          } as CoreToolMessage;
        }
        return undefined;
      })
      .filter(Boolean) as CoreMessage[];

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
            parameters: jsonSchemaToZod(cur.function.parameters),
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
        created: result.usage.completionTokens || 0,
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
                  arguments: JSON.stringify(toolCall.args),
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
          prompt_tokens: result.usage.promptTokens,
          completion_tokens: result.usage.completionTokens,
          total_tokens: result.usage.totalTokens,
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
      id: '',
      created: 0,
      object: 'chat.completion.chunk',
      model: this.llmConfig.model,
      choices: [choice],
    };

    if (chunk.type === 'step-start') {
      return result;
    }

    if (chunk.type === 'text-delta') {
      choice.delta.content = chunk.textDelta;
      result.choices = [choice];
    } else if (chunk.type === 'tool-call') {
      choice.delta.tool_calls = [
        {
          id: chunk.toolCallId,
          type: 'function',
          function: {
            name: chunk.toolName,
            arguments: JSON.stringify(chunk.args),
          },
        },
      ];
    } else if (chunk.type === 'step-finish' || chunk.type === 'finish') {
      choice.finish_reason = 'stop';
      choice.native_finish_reason = 'stop';
      result.choices = [choice];
    } else if (chunk.type === 'reasoning-signature') {
      choice.delta.content = chunk.signature;
      result.choices = [choice];
      choice.finish_reason = 'stop';
      choice.native_finish_reason = 'stop';
    }

    return result;
  }
}
