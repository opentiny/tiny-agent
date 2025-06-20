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
  const sseEndpointServer = new SSEEndpointServer({ port: 8082 }, connectorCenter);
  sseEndpointServer.start();

  return {
    connectorCenter,
    sseEndpointServer,
  };
}
