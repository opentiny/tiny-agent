import { EndpointTransport, WebSocketClientEndpoint, SSEClientEndpoint } from '@opentiny/tiny-agent-mcp-connector';
import { McpValidator } from '@opentiny/tiny-agent-mcp-service';
import { setupMcpService } from '@opentiny/tiny-agent-mcp-service-vue';
import { McpToolParser } from '@opentiny/tiny-agent-task-mcp';
import { useTaskScheduler } from './scheduler';
import mcpToolJson from './mcp-tool.json';

export function initMcp() {
  // Connector
  const sseEndpoint = new SSEClientEndpoint('http://localhost:8082/client');
  const wsEndpoint = new WebSocketClientEndpoint({ url: import.meta.env.VITE_CONNECTOR_ENDPOINT_URL });
  const endpointTransport = new EndpointTransport(sseEndpoint);

  // MCP Service
  const mcpService = setupMcpService();
  mcpService.mcpServer.connect(endpointTransport);

  // MCP Validator
  const mcpValidator = new McpValidator();
  mcpService.setValidator(mcpValidator);

  // Task Scheduler
  const { taskScheduler, actionManager } = useTaskScheduler();
  const doTask = async (task) => taskScheduler.pushTask(task);

  // MCP Tool Parser & mcp-tool.json
  const mcpToolParser = new McpToolParser(doTask);
  mcpToolParser.extractAllTools(mcpToolJson).forEach((tool) => {
    mcpService.mcpServer.registerTool(tool.name, tool.config, tool.cb);
  });

  return {
    sseEndpoint,
    wsEndpoint,
    endpointTransport,
    mcpService,
    mcpValidator,
    taskScheduler,
    actionManager,
    mcpToolParser,
  };
}
