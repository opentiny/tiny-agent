import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebSocketServerEndpoint, ConnectorCenter, WebSocketEndpointServer, WebSocketClientEndpoint, EndpointTransport } from './src';

export function runServer() {
  const connectorCenter = new ConnectorCenter<WebSocketServerEndpoint>();
  const webSocketEndpointServer = new WebSocketEndpointServer({ port: 8082 }, connectorCenter);
  webSocketEndpointServer.start();
  return {
    connectorCenter,
    webSocketEndpointServer,
  }
}

export function runInBrowser() {
  const mcpServer = new McpServer({ name: 'test', version: '0.0.1' });
  mcpServer.tool('add', '加法', {
    type: 'object',
    properties: {
      a: { type: 'number' },
      b: { type: 'number' },
    },
  }, async ({ a, b }) => {
    return {
      content: [
        {
          type: 'text',
          text: `${a + b}`,
        },
      ]
    };
  });
  function getWebSocketClientEndpoint() {
    return new WebSocketClientEndpoint({url: 'ws://localhost:8082'});
  }
  mcpServer.connect(new EndpointTransport(getWebSocketClientEndpoint));
}