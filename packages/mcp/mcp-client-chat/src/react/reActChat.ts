import { logger } from '../logger/index.js';
import { McpClientChat } from '../mcp-client-chat.js';
import type { ChatBody, ChatCompleteResponse, MCPClientOptions, NonStreamingChoice, Tool, ToolCall } from '../type.js';
import { FORMAT_INSTRUCTIONS, PREFIX, RE_ACT_DEFAULT_SUMMARY, SUFFIX } from './systemPrompt.js';

const FINAL_ANSWER_TAG = 'Final Answer:';
const ACTION_TAG = '"action":';

export class ReActChat extends McpClientChat {
  constructor(options: MCPClientOptions) {
    options.llmConfig.summarySystemPrompt = options.llmConfig.summarySystemPrompt ?? RE_ACT_DEFAULT_SUMMARY;

    super(options);
  }

  protected async initSystemPromptMessages(): Promise<string> {
    let tools: Tool[] = [];

    try {
      tools = await this.fetchToolsList();
    } catch (_error) {
      tools = [];
    }

    const toolStrings = tools.length ? JSON.stringify(tools) : '';
    const prompt = [this.options.llmConfig.systemPrompt, PREFIX, toolStrings, FORMAT_INSTRUCTIONS, SUFFIX].join('\n\n');

    return prompt;
  }

  protected async organizeToolCalls(response: ChatCompleteResponse): Promise<[ToolCall[], string]> {
    const text = (response.choices[0] as NonStreamingChoice).message.content ?? '';

    if (text.includes(FINAL_ANSWER_TAG) && !text.includes(ACTION_TAG)) {
      const parts = text.split(FINAL_ANSWER_TAG);
      const output = parts[parts.length - 1].trim();
      return [[], output];
    }

    if (!text.includes(ACTION_TAG)) {
      return [[], text.trim()];
    }

    const toolCalls: ToolCall[] = [];

    if (text.includes('```')) {
      const actionBlocks = text
        .trim()
        .split(/```(?:json)?/)
        .filter((block: string) => block.includes(ACTION_TAG));

      actionBlocks.forEach((block: string) => {
        try {
          const { action, action_input } = JSON.parse(block.trim());

          if (!action || typeof action !== 'string') {
            logger.error('Invalid tool call: missing or invalid action field');

            return;
          }

          toolCalls.push({
            id: `call_${Math.random().toString(36).slice(2)}`,
            type: 'function',
            function: {
              name: action,
              arguments: typeof action_input === 'string' ? action_input : JSON.stringify(action_input || {}),
            },
          });
        } catch (error) {
          logger.error('Failed to parse tool call JSON:', error);
        }
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
