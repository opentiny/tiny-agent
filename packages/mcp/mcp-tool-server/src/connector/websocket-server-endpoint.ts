import { WebSocket } from 'ws';
import { IConnectorEndpoint, IEndpointMessage } from './endpoint.type';

export class WebSocketServerEndpoint implements IConnectorEndpoint {
  public clientId: string;
  public clientIdResolved: Promise<string>;
  protected ws: WebSocket;

  constructor(clientId: string, ws: WebSocket) {
    this.clientId = clientId;
    this.clientIdResolved = Promise.resolve(clientId);
    this.ws = ws;
  }
  async start(): Promise<void> {
    this.ws.on('message', (messageStr: string) => {
      const message: IEndpointMessage = JSON.parse(messageStr);
      if (message.type === 'initialize') {
        this.send({
          type: 'initialize',
          data: {
            clientId: this.clientId
          } as any,
        })
        return
      }
      this.onmessage?.(message);
    })
  }

  async close(): Promise<void> {
    this.ws.close();
  }

  async send(message: IEndpointMessage): Promise<void> {
    this.ws.send(JSON.stringify(message));
  }

  // override by proxy server
  onmessage = null;
  onclose = null;
  onerror = null;
}
