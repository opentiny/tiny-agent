// import { createServer } from '../node_modules/@antv/mcp-server-chart/build/server.js'; // server.js not exported in package.json, read from file system
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from '../../packages/chart-mcp-server/src/server.js';

export function createChartMcpServer() {
  const mcpServer = new McpServer({
    name: 'chart-server',
    version: '1.0.0',
    capabilities: {
      resources: {},
      tools: {}
    }
  });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  registerTools(mcpServer);
  mcpServer.connect(serverTransport);

  return {
    server: mcpServer,
    transport: clientTransport,
  };
}
