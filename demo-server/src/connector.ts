import { WebSocketServerEndpoint, ConnectorCenter, WebSocketEndpointServer } from '@opentiny/tiny-agent-mcp-connector';
import type { Request } from 'express';
import type { WebSocket } from 'ws';

export function createConnector() {
  const connectorCenter = new ConnectorCenter<WebSocketServerEndpoint>();
  const webSocketEndpointServer = new WebSocketEndpointServer({ noServer: true }, connectorCenter);
  webSocketEndpointServer.start();

  const websocketConnectionHandler = async(ws: WebSocket, req: Request) => {
    webSocketEndpointServer.wss.emit('connection', ws, req);
  }
  return {
    connectorCenter,
    webSocketEndpointServer,
    websocketConnectionHandler
  }
}
