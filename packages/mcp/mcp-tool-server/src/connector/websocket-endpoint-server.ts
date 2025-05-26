import { WebSocket, WebSocketServer } from 'ws';
import { ConnectorCenter } from './connector-center';
import { WebSocketServerEndpoint } from './websocket-server-endpoint';
import { genClientId } from '../utils/genClientId';
import { IEndpointMessage } from './endpoint.type';
export class WebSocketEndpointServer {
  protected wss: WebSocketServer;
  protected connectorCenter: ConnectorCenter<WebSocketServerEndpoint>;
  protected shareConnection: boolean;

  constructor(config: { port: number, share?: boolean }, connectorCenter: ConnectorCenter<WebSocketServerEndpoint>) {
    this.wss = new WebSocketServer(config);
    this.connectorCenter = connectorCenter;
    this.shareConnection = config.share;
  }

  start() {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = genClientId();
      const endpointFactory = (serverId?: string) => {
        const endpoint = new WebSocketServerEndpoint(ws, clientId, serverId);
        endpoint.start();
        return endpoint; 
      }

      if (this.shareConnection) {
        this.connectorCenter.setClient(clientId, endpointFactory);
      } else {
        this.connectorCenter.setClient(clientId, endpointFactory());
      }

      ws.on('message', (messageStr: string) => {
        const message = JSON.parse(messageStr);
        if (message.type === 'initialize') {
          ws.send(JSON.stringify({
            type: 'initialize',
            data: {
              clientId
            }
          }))
        }
      })

      ws.on('close', () => {
        this.connectorCenter.removeClient(clientId);
      });
    })
  }
}