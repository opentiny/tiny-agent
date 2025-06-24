import * as http from 'node:http';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types';
import { EndpointMessageType, IConnectorEndpoint, IEndpointMessage } from '../endpoint.type';

export class SSEServerEndpoint implements IConnectorEndpoint {
  protected app: http.Server;
  protected res: http.ServerResponse;
  public clientId: string;
  public clientIdResolved: Promise<string>;

  constructor(app: http.Server, res: any, clientId: string) {
    this.app = app;
    this.res = res;
    this.clientId = clientId;
    this.clientIdResolved = Promise.resolve(clientId);
  }

  async start(): Promise<void> {
    this.app.on('request', (req, res) => {
      if (req.url === '/message') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', '*');

        let body = '';

        req.on('data', (chunk) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const message = JSON.parse(body);
            if (message.type === EndpointMessageType.INITIALIZE) {
              res.end();
              return;
            }

            this.onmessage?.(message);
          } finally {
            res.end();
          }
        });
      }
    });
  }
  async close(): Promise<void> {
    this.res.end();
  }
  async send(message: IEndpointMessage<JSONRPCMessage>): Promise<void> {
    this.res.write(`data: ${JSON.stringify(message)}\n\n`);
  }
  onmessage?: ((message: IEndpointMessage<JSONRPCMessage>) => void) | null | undefined;
  onclose?: (() => void) | null | undefined;
  onerror?: ((error: Error) => void) | null | undefined;
}
