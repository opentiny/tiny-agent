import { inject, onBeforeUnmount, onMounted, provide } from 'vue';
import { MCP_SERVICE, McpService } from '@opentiny/tiny-agent-mcp-service';

export type DynamicToolFn = (...mcpTool: Parameters<McpService['registerTool']>) => void

export function useMcpService(): { mcp: McpService, tool: DynamicToolFn} {
  const mcpService = inject(MCP_SERVICE) as McpService;
  if (!mcpService) {
    throw new Error('McpService not found');
  }
  const tool = (...mcpTool: Parameters<McpService['registerTool']>) => {
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
