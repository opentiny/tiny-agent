import { inject, onBeforeUnmount, onMounted, provide } from 'vue';
import { MCP_SERVICE, McpService } from '@opentiny/tiny-agent-mcp-service';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';

export function useMcpService() {
  const mcpService = inject(MCP_SERVICE) as McpService;
  if (!mcpService) {
    throw new Error('McpService not found');
  }
  const tool = (...mcpTool: Parameters<McpServer['tool']>) => {
    onMounted(() => {
      mcpService.registerTool(...mcpTool);
    });
    onBeforeUnmount(() => {
      mcpService.unregisterTool(mcpTool[0]);
    });
  }
  return {
    mcp: mcpService,
    tool
  };
}

export function setupMcpService() {
  const mcpService = new McpService();
  provide(MCP_SERVICE, mcpService);
  return mcpService;
}