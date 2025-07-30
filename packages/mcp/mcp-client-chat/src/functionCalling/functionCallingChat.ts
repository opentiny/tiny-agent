import { McpClientChat } from '../mcp-client-chat.js';
import type {
  ChatCompleteRequest,
  ChatCompleteResponse,
  MCPClientOptions,
  NonStreamingChoice,
  Tool,
  ToolCall,
} from '../type.js';
import { Role } from '../type.js';
import { DEFAULT_SUMMARY_SYSTEM_PROMPT, DEFAULT_SYSTEM_PROMPT } from './systemPrompt.js';

export class FunctionCallChat extends McpClientChat {
  constructor(options: MCPClientOptions) {
    options.llmConfig.summarySystemPrompt = options.llmConfig.summarySystemPrompt ?? DEFAULT_SUMMARY_SYSTEM_PROMPT;
    super(options);
  }

  protected async initSystemPromptMessages(): Promise<string> {
    return this.options.llmConfig.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  }

  protected async organizeToolCalls(
    response: ChatCompleteResponse,
  ): Promise<{ toolCalls: ToolCall[]; thought?: string; finalAnswer: string }> {
    const message = (response.choices[0] as NonStreamingChoice).message;

    const toolCalls = message.tool_calls || [];
    let finalAnswer = '';

    if (!toolCalls.length) {
      finalAnswer = message.content ?? '';
    }

    return { toolCalls, finalAnswer };
  }

  protected async getChatBody(): Promise<ChatCompleteRequest> {
    let tools: Tool[] = [];

    try {
      tools = await this.fetchToolsList();
    } catch (_error) {
      tools = [];
    }
    // 过滤和验证消息格式，确保符合 API 要求
    const processedMessages = this.messages.map((msg) => {
      // 确保消息内容不为空
      if (msg.role === Role.ASSISTANT && msg.tool_calls && !msg.content) {
        return { ...msg, content: '' }; // DeepSeek API 要求 content 字段存在
      }
      return msg;
    });
    const { apiKey, url, systemPrompt, summarySystemPrompt, model, ...llmConfig } = this.options.llmConfig;
    const chatBody: ChatCompleteRequest = {
      model,
      messages: processedMessages,
      ...llmConfig,
    };

    // 只有在有工具且当前迭代步数大于0时才添加tools字段
    // 避免传递空数组，因为某些API（如DeepSeek）不接受空的tools数组
    if (this.iterationSteps > 0 && tools.length > 0) {
      chatBody.tools = tools;
    }

    return chatBody;
  }
}
