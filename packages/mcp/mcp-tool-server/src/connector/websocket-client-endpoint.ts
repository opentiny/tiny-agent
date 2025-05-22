import { WebSocket } from 'ws';
import { IConnectorEndpoint, IEndpointMessage } from './endpoint.type';

export class WebSocketClientEndpoint implements IConnectorEndpoint {
  public clientId: string | number;
  protected ws: WebSocket;
  protected url: string;

  constructor(options: { url: string }) {
    this.url = options.url;
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        const message = {
          type: 'initialize'
        }
        this.send(message)
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      this.ws.on('close', () => {
        console.log('WebSocket closed');
      });

      this.ws.on('message', (message) => {
        const parsedMessage: IEndpointMessage = JSON.parse(message.toString());
        if (parsedMessage.type === 'initialize') {
          this.clientId = (parsedMessage.data as any).clientId;
          resolve();
          return;
        }
        this.onmessage(message as IEndpointMessage);
      });
    });
  }
  async close(): Promise<void> {
    this.ws.close();
  }

  async send(message: IEndpointMessage): Promise<void> {
    this.ws.send(JSON.stringify(message));
  }

  // override by transport
  onmessage = (message: IEndpointMessage) => { }
}
