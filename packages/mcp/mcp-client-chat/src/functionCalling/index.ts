import { McpClientChat } from '../mcp-client-chat.js';

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

export class FunctionCallChat extends McpClientChat {
  protected async initSystemPromptMessages(): Promise<string> {
    return this.options.llmConfig.systemPrompt;
  }

  protected async organizeToolCalls(response: ChatCompleteResponse): Promise<[ToolCall[], string]> {
    const toolCalls = response.choice[0].message.tool_calls || [];
    let finalAnswer = '';

    if (!toolCalls.length) {
      finalAnswer = response.choice[0].message.content ?? '';
    }

    return [toolCalls, finalAnswer];
  }
}
