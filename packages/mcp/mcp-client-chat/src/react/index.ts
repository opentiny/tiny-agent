import { McpClientChat } from '../mcp-client-chat.js';
import { FORMAT_INSTRUCTIONS, PREFIX, SUFFIX } from './ReActSystemPrompt.js';

import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import type {
  AvailableTool,
  ChatBody,
  ChatCompleteResponse,
  ChatCreatePromptArgs,
  IChatOptions,
  MCPClientOptions,
  McpServer,
  Message,
  NonStreamingChoice,
  ToolCall,
  ToolResults,
} from './type.js';
import { AgentStrategy, Role } from './type.js';

const FINAL_ANSWER_ACTION = 'Final Answer:';

export class ReActChat extends McpClientChat {
  protected async initSystemPromptMessages(): Promise<string> {
    return this.createReActSystemPrompt();
  }

  protected async createReActSystemPrompt(): Promise<string> {
    const tools = await this.fetchToolsList();

    const toolStrings = JSON.stringify(tools);
    const prompt = [PREFIX, toolStrings, FORMAT_INSTRUCTIONS, SUFFIX].join('\n\n');

    return prompt;
  }

  /**
   * 从字符串中提取 action 和 action_input
   * @param str 包含 action 和 action_input 的字符串
   * @returns 包含 action 和 action_input 的对象数组
   */
  async organizeToolCalls(response: ChatCompleteResponse): Promise<[ToolCall[], string]> {
    const text = response.choice[0].message.content;

    if (text.includes(FINAL_ANSWER_ACTION) || !text.includes(`"action":`)) {
      const parts = text.split(FINAL_ANSWER_ACTION);
      const output = parts[parts.length - 1].trim();
      return [[], output];
    }

    const tollCalls: ToolCall[] = [];

    if (text.includes('```')) {
      const actionBlocks = text
        .trim()
        .split(/```(?:json)?/)
        .filter((block) => block.includes(`"action":`));

      actionBlocks.forEach((block) => {
        try {
          const { action, action_input } = JSON.parse(block.trim());

          tollCalls.push({
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

    return [tollCalls, ''];
  }
}
