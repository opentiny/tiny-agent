import { McpClientChat } from '../mcp-client-chat.js';

import type { ChatBody, ChatCompleteResponse, MCPClientOptions, NonStreamingChoice, ToolCall } from '../type.js';

export default class FunctionCallChat extends McpClientChat {
  constructor(options: MCPClientOptions) {
    super(options);
  }

  protected async initSystemPromptMessages(): Promise<string> {
    return this.options.llmConfig.systemPrompt;
  }

  protected async organizeToolCalls(response: ChatCompleteResponse): Promise<[ToolCall[], string]> {
    const message = (response.choices[0] as NonStreamingChoice).message;
    const toolCalls = message.tool_calls || [];
    let finalAnswer = '';

    if (!toolCalls.length) {
      finalAnswer = message.content ?? '';
    }

    return [toolCalls, finalAnswer];
  }

  protected async getChatBody(): Promise<ChatBody> {
    const tools = await this.fetchToolsList();

    const { model } = this.options.llmConfig;
    const chatBody: ChatBody = {
      model,
      messages: this.messages,
      tools: this.iterationSteps > 0 ? tools : [],
    };

    return chatBody;
  }
}
