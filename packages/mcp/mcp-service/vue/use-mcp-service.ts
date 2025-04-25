import { inject, onBeforeUnmount, onMounted, provide } from 'vue';
import { MCP_SERVICE, McpService, ITool } from '@opentiny/tiny-agent-mcp-service';

export function useMcpService() {
  const mcpService = inject(MCP_SERVICE) as McpService;
  if (!mcpService) {
    throw new Error('McpService not found');
  }
  const tool = (mcpTool: ITool) => {
    onMounted(() => {
      mcpService.registerTool(mcpTool);
    });
    onBeforeUnmount(() => {
      mcpService.unregisterTool(mcpTool.name);
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