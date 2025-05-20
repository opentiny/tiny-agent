import { McpClient } from './core/mcp-client-core.js';
import type { MCPClientOptions } from './core/mcp-client-core.type.js';

function createMCPClient(options: MCPClientOptions) {
  const mcpClient = new McpClient(options);

  return mcpClient;
}

export { McpClient, createMCPClient };
