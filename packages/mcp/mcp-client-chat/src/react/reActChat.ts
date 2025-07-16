import { logger } from '../logger/index.js';
import { McpClientChat } from '../mcp-client-chat.js';
import type {
  ChatCompleteRequest,
  ChatCompleteResponse,
  MCPClientOptions,
  NonStreamingChoice,
  StreamingChoice,
  Tool,
  ToolCall,
} from '../type.js';
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

  protected async organizeToolCalls(
    response: ChatCompleteResponse,
  ): Promise<{ toolCalls: ToolCall[]; thought?: string; finalAnswer: string }> {
    let text: string;

    if (this.options.streamSwitch) {
      text = (response.choices[0] as StreamingChoice).delta.content ?? '';
    } else {
      text = (response.choices[0] as NonStreamingChoice).message.content ?? '';
    }

    // 修复正则表达式的回溯问题，避免使用容易导致指数级回溯的写法
    // 只匹配 Thought: 和 Action:或FinalAnswer: 之间的内容，可能有多条
    // 提取所有 Thought: 和 Action: 之间的内容，以及 Final Answer
    // 这里我们用正则匹配 Thought: ... (Action: ...)? (Observation: ...)? (可多次) Final Answer: ...
    // 但这里只需要提取 Thought 和 Action 片段，便于后续处理
    // 另外也尝试提取第一个 Thought 作为思考内容
    let thought: string | undefined = undefined;

    // 匹配 Thought: ... (Action: ...)? 片段
    // 允许 Thought: 和 Action: 之间跨多行，非贪婪匹配
    const thoughtActionRegex = /Thought(.*?)(?:Action|Final Answer|$)/gs;
    const matches = [...text.matchAll(thoughtActionRegex)];
    if (matches.length > 0) {
      // 取第一个 Thought 作为思考内容，去除首尾的符号
      thought = matches[0][1]?.replace(/^\W|$/, '')?.trim();
    }

    if (text.includes(FINAL_ANSWER_TAG) && !text.includes(ACTION_TAG)) {
      const parts = text.split(FINAL_ANSWER_TAG);
      const output = parts[parts.length - 1].trim();
      return {
        toolCalls: [],
        thought,
        finalAnswer: output,
      };
    }

    if (!text.includes(ACTION_TAG)) {
      return {
        toolCalls: [],
        thought,
        finalAnswer: text.trim(),
      };
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

    return {
      toolCalls: toolCalls,
      thought,
      finalAnswer: text.trim(),
    };
  }

  protected async getChatBody(): Promise<ChatCompleteRequest> {
    const { model } = this.options.llmConfig;
    const { apiKey, url, systemPrompt, summarySystemPrompt, ...llmConfig } = this.options.llmConfig;
    const chatBody: ChatCompleteRequest = {
      model,
      messages: this.messages,
      ...llmConfig,
    };

    return chatBody;
  }

  protected clearPromptMessages(): void {
    this.messages = [];
  }
}
