import { McpClient } from './core/mcp-client-core.js';
import type { MCPClientOptions } from './core/mcp-client-core.type.js';

async function createMCPClient(options: MCPClientOptions) {
  const mcpClient = new McpClient(options);

  await mcpClient.init();

  return mcpClient;
}

export { McpClient, createMCPClient };
