import { McpClient } from './core/mcp-client-core.js';
import type { MCPClientOptions } from './core/mcp-client-core.type.js';

export function createMCPClient(options: MCPClientOptions) {
  const mcpClient = new McpClient(options);

  return mcpClient;
}
