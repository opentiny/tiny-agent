import OpenAI from 'openai';
import type {
  ChatBody,
  ChatCompleteResponse,
  LlmConfig,
  ResponseUsage,
  Role,
  StreamingChoice,
  ToolCall,
} from '../../../type.js';
import type { BaseAIProvider } from '../../types.js';
import type { OpenAIConfig } from './types.js';

export class OpenAIProvider implements BaseAIProvider {
  public readonly name = 'openai';
  private sdkInstance: OpenAI;
  private config: LlmConfig;

  constructor(config: LlmConfig) {
    this.config = config;
    this.sdkInstance = new OpenAI(config);
  }

  /**
   * 处理聊天请求（非流式）
   */
  async chat(request: ChatBody): Promise<ChatCompleteResponse> {
    try {
      const openAIRequest = this.transformRequest(request, false);

      const response = await this.sdkInstance.chat.completions.create(openAIRequest as any);

      return this.transformResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 处理聊天请求（流式）
   */
  async *chatStream(request: ChatBody): AsyncGenerator<ChatCompleteResponse> {
    try {
      const openAIRequest = this.transformRequest(request, true);

      const stream = await this.sdkInstance.chat.completions.create(openAIRequest as any);

      for await (const chunk of stream as any) {
        yield this.transformStreamResponse(chunk);
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 转换请求格式
   */
  private transformRequest(request: ChatBody, isStream: boolean) {
    const { messages, model, tools, ...rest } = request;

    // 处理系统提示词
    let processedMessages = messages;
    if (this.config.systemPrompt && messages.length > 0 && messages[0].role !== 'system') {
      processedMessages = [{ role: 'system', content: this.config.systemPrompt }, ...messages];
    }

    const baseRequest = {
      messages: processedMessages as any, // 类型断言避免复杂转换
      model: model || this.config.model,
      temperature: this.config.temperature,
      max_tokens: this.config.max_tokens,
      ...rest,
    };

    if (tools && tools.length > 0) {
      return {
        ...baseRequest,
        tools: tools as any,
        tool_choice: 'auto',
        stream: isStream,
      };
    }

    return {
      ...baseRequest,
      stream: isStream,
    };
  }

  /**
   * 转换响应格式
   */
  private transformResponse(response: OpenAI.Chat.Completions.ChatCompletion): ChatCompleteResponse {
    const choices = response.choices.map((choice) => ({
      finish_reason: choice.finish_reason,
      native_finish_reason: choice.finish_reason,
      message: {
        content: choice.message.content,
        role: choice.message.role as Role,
        tool_calls: choice.message.tool_calls?.map((toolCall) => ({
          id: toolCall.id,
          type: 'function' as const,
          function: {
            name: toolCall.function?.name || '',
            arguments: toolCall.function?.arguments || '',
          },
        })) as ToolCall[] | undefined,
      },
    }));

    const usage: ResponseUsage | undefined = response.usage
      ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
        }
      : undefined;

    return {
      id: response.id,
      choices,
      created: response.created,
      model: response.model,
      object: 'chat.completion',
      usage,
    };
  }

  /**
   * 转换流式响应格式
   */
  private transformStreamResponse(chunk: OpenAI.Chat.Completions.ChatCompletionChunk): ChatCompleteResponse {
    const choices: StreamingChoice[] = chunk.choices.map((choice) => ({
      finish_reason: choice.finish_reason,
      native_finish_reason: choice.finish_reason,
      delta: {
        content: choice.delta.content || null,
        role: choice.delta.role as Role | undefined,
        tool_calls: choice.delta.tool_calls?.map((toolCall) => ({
          id: toolCall.id,
          type: 'function' as const,
          function: {
            name: toolCall.function?.name || '',
            arguments: toolCall.function?.arguments || '',
          },
        })) as ToolCall[] | undefined,
      },
    }));

    return {
      id: chunk.id,
      choices,
      created: chunk.created,
      model: chunk.model,
      object: 'chat.completion.chunk',
    };
  }

  /**
   * 错误处理
   */
  private handleError(error: any): Error {
    if (error instanceof OpenAI.APIError) {
      return new Error(`OpenAI API 错误: ${error.message} (状态码: ${error.status})`);
    } else if (error instanceof OpenAI.APIConnectionError) {
      return new Error(`OpenAI 连接错误: ${error.message}`);
    } else if (error instanceof OpenAI.RateLimitError) {
      return new Error(`OpenAI 速率限制: ${error.message}`);
    } else if (error instanceof OpenAI.BadRequestError) {
      return new Error(`OpenAI 请求错误: ${error.message}`);
    } else if (error instanceof OpenAI.AuthenticationError) {
      return new Error(`OpenAI 认证错误: ${error.message}`);
    } else if (error instanceof OpenAI.PermissionDeniedError) {
      return new Error(`OpenAI 权限错误: ${error.message}`);
    } else if (error instanceof OpenAI.NotFoundError) {
      return new Error(`OpenAI 资源未找到: ${error.message}`);
    } else if (error instanceof OpenAI.ConflictError) {
      return new Error(`OpenAI 冲突错误: ${error.message}`);
    } else if (error instanceof OpenAI.UnprocessableEntityError) {
      return new Error(`OpenAI 处理错误: ${error.message}`);
    } else if (error instanceof OpenAI.InternalServerError) {
      return new Error(`OpenAI 服务器错误: ${error.message}`);
    } else {
      return new Error(`未知错误: ${error.message || error}`);
    }
  }

  /**
   * 获取配置信息
   */
  getConfig(config: LlmConfig): Record<string, any> {
    return { ...config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 重新创建客户端
    this.sdkInstance = new OpenAI(this.config);
  }

  /**
   * 检查配置是否有效
   */
  validateConfig(): boolean {
    return !!(this.config.apiKey && this.config.model);
  }

  /**
   * 获取支持的模型列表
   */
  getSupportedModels(): string[] {
    return ['gpt-4', 'gpt-4-turbo', 'gpt-4-turbo-preview', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'];
  }

  /**
   * 检查模型是否支持
   */
  isModelSupported(model: string): boolean {
    return this.getSupportedModels().includes(model);
  }
}
