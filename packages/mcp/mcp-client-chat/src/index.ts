import { McpClientChat } from './mcp-client-chat.js';
import type { MCPClientOptions } from './type.js';

async function createMCPClientChat(options: MCPClientOptions): Promise<McpClientChat> {
  const mcpClient = new McpClientChat(options);

  await mcpClient.init();

  return mcpClient;
}

export { McpClientChat, createMCPClientChat };
