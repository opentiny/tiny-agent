import {
  WebSocketServerEndpoint,
  ConnectorCenter,
  WebSocketEndpointServer,
  SSEEndpointServer,
  SSEServerEndpoint,
} from '@opentiny/tiny-agent-mcp-connector';
import type { Request } from 'express';
import type { WebSocket } from 'ws';

export function createConnector() {
  const connectorCenter = new ConnectorCenter<WebSocketServerEndpoint>();
  const webSocketEndpointServer = new WebSocketEndpointServer({ noServer: true }, connectorCenter);
  webSocketEndpointServer.start();

  const websocketConnectionHandler = async (ws: WebSocket, req: Request) => {
    webSocketEndpointServer.wss.emit('connection', ws, req);
  };
  return {
    connectorCenter,
    webSocketEndpointServer,
    websocketConnectionHandler,
  };
}

export function createSSEConnector() {
  const connectorCenter = new ConnectorCenter<SSEServerEndpoint>();
  const port = 8082;
  const sseEndpointServer = new SSEEndpointServer({ port }, connectorCenter);
  sseEndpointServer.start();

  try {
    sseEndpointServer.start();
  } catch (error) {
    console.error(`Failed to start SSE endpoint server on port ${port}:`, error);
    throw error;
  }

  return {
    connectorCenter,
    sseEndpointServer,
  };
}
