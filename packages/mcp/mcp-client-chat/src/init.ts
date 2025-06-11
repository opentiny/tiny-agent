import type { McpClientChat } from './mcp-client-chat.js';
import { FunctionCallChat } from './functionCalling/index.js';
import { ReActChat } from './react/index.js';
import { AgentStrategy, type MCPClientOptions } from './type.js';

export async function createMCPClientChat(options: MCPClientOptions): Promise<McpClientChat> {
  const chatMap = {
    [AgentStrategy.FUNCTION_CALLING]: FunctionCallChat,
    [AgentStrategy.RE_ACT]: ReActChat,
  };
  const agentStrategy = options.agentStrategy ?? AgentStrategy.FUNCTION_CALLING;
  const Chat = chatMap[agentStrategy];
  const mcpClient = new Chat(options);

  await mcpClient.init();

  return mcpClient;
}
