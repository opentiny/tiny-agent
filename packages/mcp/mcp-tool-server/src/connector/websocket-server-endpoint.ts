import { WebSocket } from 'ws';
import { IConnectorEndpoint, IEndpointMessage } from './endpoint.type';

export class WebSocketServerEndpoint implements IConnectorEndpoint {
  public clientId: string;
  protected ws: WebSocket;

  constructor(clientId: string, ws: WebSocket) {
    this.clientId = clientId;
    this.ws = ws;
  }
  async start(): Promise<void> {
    this.ws.on('message', (message: string) => {
      const endpointMessage = JSON.parse(message) as IEndpointMessage;
      if (endpointMessage.type === 'initialize') {
        this.send({
          type: 'initialize',
          data: {
            clientId: this.clientId
          } as any,
        })
        return
      }
      this.onmessage(endpointMessage)
    })
  }

  async close(): Promise<void> {
    this.ws.close();
  }

  async send(message: IEndpointMessage): Promise<void> {
    this.ws.send(JSON.stringify(message));
  }

  // override by proxy server
  onmessage = (message: IEndpointMessage) => { }
}
