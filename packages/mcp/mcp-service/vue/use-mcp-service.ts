import { inject, provide } from 'vue';
import { MCP_SERVICE, McpService } from '@opentiny/tiny-agent-mcp-service';

export function useMcpService() {
  const mcpService = inject(MCP_SERVICE) as McpService;
  if (!mcpService) {
    throw new Error('McpService not found');
  }
  return mcpService;
}

export function setupMcpService() {
  const mcpService = new McpService();
  provide(MCP_SERVICE, mcpService);
  return mcpService;
}