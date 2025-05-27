import { IConnectorEndpoint, IEndpointMessage } from '../endpoint.type';

export class WebSocketClientEndpoint implements IConnectorEndpoint {
  public clientId: string | number;
  public clientIdResolved: Promise<string | number>;
  protected clientIdResolver: (id: string | number) => void;
  protected ws: WebSocket;
  protected url: string;

  constructor(options: { url: string }) {
    this.url = options.url;
    this.clientIdResolved = new Promise((resolve) => {
      this.clientIdResolver = resolve;
    });
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        const message = {
          type: 'initialize'
        }
        this.send(message)
        resolve();
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
      };

      this.ws.onmessage = (messageEvent: MessageEvent<string>) => {
        const message: IEndpointMessage = JSON.parse(messageEvent.data);
        if (message.type === 'initialize') {
          this.clientId = (message.data as any).clientId;
          this.clientIdResolver(this.clientId);
          return;
        }
        this.onmessage(message);
      };
    
    });
  }
  async close(): Promise<void> {
    this.ws.close();
  }

  async send(message: IEndpointMessage): Promise<void> {
    if(message.type !== 'initialize') {
      await this.clientIdResolved;
    }
    this.ws.send(JSON.stringify(message));
  }

  // override by transport
  onmessage = null
  onclose = null;
  onerror = null;
}
