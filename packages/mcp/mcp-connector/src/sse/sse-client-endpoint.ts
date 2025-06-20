import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types';
import { EndpointMessageType, IConnectorEndpoint, IEndpointMessage } from '../endpoint.type';

export class SSEClientEndpoint implements IConnectorEndpoint {
  public clientId!: string | number;
  public clientIdResolved: Promise<string | number>;
  protected clientIdResolver!: (id: string | number) => void;
  protected eventSource!: EventSource;
  protected url: string;
  protected config?: EventSourceInit;

  constructor(url: string, config?: EventSourceInit) {
    this.url = url;
    this.config = config;
    this.clientIdResolved = new Promise((resolve) => {
      this.clientIdResolver = resolve;
    });
  }
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.eventSource = new EventSource(this.url, this.config);

      this.eventSource.onopen = () => {
        const message = {
          type: EndpointMessageType.INITIALIZE,
        };
        this.send(message);
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        this.onerror?.(error as any);
      };

      this.eventSource.onmessage = (messageEvent: MessageEvent<string>) => {
        const message: IEndpointMessage = JSON.parse(messageEvent.data);
        if (message.type === EndpointMessageType.INITIALIZE) {
          this.clientId = (message.data as any).clientId;
          this.clientIdResolver(this.clientId);
          resolve();
          return;
        }
        this.onmessage?.(message);
      };
    });
  }
  async close(): Promise<void> {
    this.eventSource.close();
    this.onclose?.();
  }
  async send(message: IEndpointMessage<JSONRPCMessage>): Promise<void> {
    if (message.type !== EndpointMessageType.INITIALIZE) {
      await this.clientIdResolved;
    }

    fetch(`${this.url}/message`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }
  onmessage?: ((message: IEndpointMessage<JSONRPCMessage>) => void) | null | undefined;
  onclose?: (() => void) | null | undefined;
  onerror?: ((error: Error) => void) | null | undefined;
}
