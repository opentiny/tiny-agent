import { McpClientChat } from '../mcp-client-chat.js';
import type { ChatBody, ChatCompleteResponse, MCPClientOptions, NonStreamingChoice, ToolCall } from '../type.js';
import { DEFAULT_SUMMARY_SYSTEM_PROMPT, FORMAT_INSTRUCTIONS, PREFIX, SUFFIX } from './systemPrompt.js';

const FINAL_ANSWER_ACTION = 'Final Answer:';

export default class ReActChat extends McpClientChat {
  constructor(options: MCPClientOptions) {
    options.llmConfig.summarySystemPrompt = options.llmConfig.summarySystemPrompt ?? DEFAULT_SUMMARY_SYSTEM_PROMPT;
    super(options);
  }

  protected async initSystemPromptMessages(): Promise<string> {
    return this.createReActSystemPrompt();
  }

  protected async createReActSystemPrompt(): Promise<string> {
    const tools = await this.fetchToolsList();

    const toolStrings = JSON.stringify(tools);
    const prompt = [PREFIX, toolStrings, FORMAT_INSTRUCTIONS, SUFFIX].join('\n\n');

    return prompt;
  }

  protected async organizeToolCalls(response: ChatCompleteResponse): Promise<[ToolCall[], string]> {
    const text = (response.choices[0] as NonStreamingChoice).message.content ?? '';

    if (text.includes(FINAL_ANSWER_ACTION) || !text.includes(`"action":`)) {
      const parts = text.split(FINAL_ANSWER_ACTION);
      const output = parts[parts.length - 1].trim();
      return [[], output];
    }

    const toolCalls: ToolCall[] = [];

    if (text.includes('```')) {
      const actionBlocks = text
        .trim()
        .split(/```(?:json)?/)
        .filter((block: string) => block.includes(`"action":`));

      actionBlocks.forEach((block: string) => {
        try {
          const { action, action_input } = JSON.parse(block.trim());

          toolCalls.push({
            id: action,
            type: 'function',
            function: {
              name: action,
              arguments: action_input,
            },
          });
        } catch (_error) {}
      });
    }

    return [toolCalls, ''];
  }

  protected async getChatBody(): Promise<ChatBody> {
    const { model } = this.options.llmConfig;
    const chatBody: ChatBody = {
      model,
      messages: this.messages,
    };

    return chatBody;
  }

  protected clearPromptMessages(): void {
    this.messages = [];
  }
}
