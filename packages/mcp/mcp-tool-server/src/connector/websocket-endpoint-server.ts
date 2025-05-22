import { WebSocket, WebSocketServer } from 'ws';
import { ConnectorCenter } from './connector-center';
import { WebSocketServerEndpoint } from './websocket-server-endpoint';
import { genClientId } from '../utils/genClientId';
export class WebSocketEndpointServer {
  private wss: WebSocketServer;
  private connectorCenter: ConnectorCenter<WebSocketServerEndpoint>;

  constructor(config: { port: number }, connectorCenter: ConnectorCenter<WebSocketServerEndpoint>) {
    this.wss = new WebSocketServer(config);
    this.connectorCenter = connectorCenter;
  }

  start() {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = genClientId();
      const endpoint = new WebSocketServerEndpoint(clientId, ws);
      endpoint.start();
      this.connectorCenter.setClient(clientId, endpoint);
      ws.on('close', () => {
        this.connectorCenter.removeClient(clientId);
      });
    })
  }
}