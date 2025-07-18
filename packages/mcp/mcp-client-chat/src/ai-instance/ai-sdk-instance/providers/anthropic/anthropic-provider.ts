import Anthropic from '@anthropic-ai/sdk';
import type { ChatBody, ChatCompleteResponse, LlmConfig, ResponseUsage, Role, StreamingChoice } from '../../../../type.js';
import type { BaseAIProvider, BaseProviderConfig } from '../../types.js';
import type { AnthropicClientOptions } from './types.js';

export class AnthropicAIProvider implements BaseAIProvider {
  public readonly name = 'anthropic';
  private sdkInstance: Anthropic;
  private config: AnthropicClientOptions;

  constructor(config: LlmConfig) {
    this.config = this.getConfig(config);
    this.sdkInstance = new Anthropic(this.config);
  }

  /**
   * 处理聊天请求（非流式）
   */
  async chat(request: ChatBody): Promise<ChatCompleteResponse> {
    try {
      const anthropicRequest = this.transformRequest(request, false);

      const response = await this.sdkInstance.messages.create(anthropicRequest as any);

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
      const anthropicRequest = this.transformRequest(request, true);

      const stream = await this.sdkInstance.messages.create(anthropicRequest as any);

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
  private transformRequest(request: ChatBody, _isStream: boolean) {
    const { messages, model, tools, ...rest } = request;

    // 处理系统提示词
    let processedMessages = messages;
    if (this.config.systemPrompt && messages.length > 0 && messages[0].role !== 'system') {
      processedMessages = [{ role: 'system', content: this.config.systemPrompt }, ...messages];
    }

    // 转换消息格式以兼容 Anthropic SDK
    const anthropicMessages = processedMessages
      .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      }));

    const baseRequest = {
      messages: anthropicMessages,
      model: model || this.config.model,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      ...rest,
    };

    if (tools && tools.length > 0) {
      return {
        ...baseRequest,
        tools: tools as any,
        stream: false,
      };
    }

    return {
      ...baseRequest,
      stream: false,
    };
  }

  /**
   * 转换响应格式
   */
  private transformResponse(response: any): ChatCompleteResponse {
    const choices = [
      {
        finish_reason: response.stop_reason,
        native_finish_reason: response.stop_reason,
        message: {
          content: response.content[0]?.text || '',
          role: response.role as Role,
          tool_calls: undefined, // Anthropic 暂不支持工具调用
        },
      },
    ];

    const usage: ResponseUsage | undefined = response.usage
      ? {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        }
      : undefined;

    return {
      id: response.id,
      choices,
      created: Date.now(),
      model: response.model,
      object: 'chat.completion',
      usage,
    };
  }

  /**
   * 转换流式响应格式
   */
  private transformStreamResponse(chunk: any): ChatCompleteResponse {
    const choices: StreamingChoice[] = [
      {
        finish_reason: chunk.type === 'message_stop' ? 'stop' : null,
        native_finish_reason: chunk.type === 'message_stop' ? 'stop' : null,
        delta: {
          content: chunk.delta?.text || null,
          role: undefined,
          tool_calls: undefined,
        },
      },
    ];

    return {
      id: `stream-${Date.now()}`,
      choices,
      created: Date.now(),
      model: this.config.model,
      object: 'chat.completion.chunk',
    };
  }

  /**
   * 错误处理
   */
  private handleError(error: any): Error {
    if (error instanceof Anthropic.APIError) {
      return new Error(`Anthropic API 错误: ${error.message} (状态码: ${error.status})`);
    } else if (error instanceof Anthropic.APIConnectionError) {
      return new Error(`Anthropic 连接错误: ${error.message}`);
    } else if (error instanceof Anthropic.RateLimitError) {
      return new Error(`Anthropic 速率限制: ${error.message}`);
    } else if (error instanceof Anthropic.BadRequestError) {
      return new Error(`Anthropic 请求错误: ${error.message}`);
    } else if (error instanceof Anthropic.AuthenticationError) {
      return new Error(`Anthropic 认证错误: ${error.message}`);
    } else if (error instanceof Anthropic.PermissionDeniedError) {
      return new Error(`Anthropic 权限错误: ${error.message}`);
    } else if (error instanceof Anthropic.NotFoundError) {
      return new Error(`Anthropic 资源未找到: ${error.message}`);
    } else if (error instanceof Anthropic.ConflictError) {
      return new Error(`Anthropic 冲突错误: ${error.message}`);
    } else if (error instanceof Anthropic.UnprocessableEntityError) {
      return new Error(`Anthropic 处理错误: ${error.message}`);
    } else if (error instanceof Anthropic.InternalServerError) {
      return new Error(`Anthropic 服务器错误: ${error.message}`);
    } else {
      return new Error(`未知错误: ${error.message || error}`);
    }
  }

  /**
   * 获取配置信息
   */
  getConfig(config: LlmConfig): AnthropicClientOptions {
    return { ...config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<AnthropicConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 重新创建客户端
    this.sdkInstance = new Anthropic({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
    });
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
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2',
    ];
  }

  /**
   * 检查模型是否支持
   */
  isModelSupported(model: string): boolean {
    return this.getSupportedModels().includes(model);
  }
}
