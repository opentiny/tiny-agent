import { WebSocket, WebSocketServer, ServerOptions } from 'ws';
import type { IncomingMessage } from 'node:http';
import { ConnectorCenter } from '../connector-center';
import { genId } from '../utils';

import { WebSocketServerEndpoint } from './websocket-server-endpoint';

export class WebSocketEndpointServer {
  public wss: WebSocketServer;
  protected connectorCenter: ConnectorCenter<WebSocketServerEndpoint>;
  protected shareConnection: boolean;

  constructor(config: ServerOptions<any, any> & {share?: boolean }, connectorCenter: ConnectorCenter<WebSocketServerEndpoint>) {
    this.wss = new WebSocketServer(config);
    this.connectorCenter = connectorCenter;
    this.shareConnection = config.share || false;
  }

  start() {
    this.wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
      const clientId = genId();
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