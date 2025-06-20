import express, { type Request, type Response } from 'express';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types';
import { EndpointMessageType, IConnectorEndpoint, IEndpointMessage } from '../endpoint.type';

export class SSEServerEndpoint implements IConnectorEndpoint {
  protected app: express.Application;
  protected res: Response;
  public clientId: string;
  public clientIdResolved: Promise<string>;

  constructor(app: express.Application, res: Response, clientId: string) {
    this.app = app;
    this.res = res;
    this.clientId = clientId;
    this.clientIdResolved = Promise.resolve(clientId);
  }

  start(): Promise<void> {
    return new Promise(() => {
      this.app.post('/message', (req: Request) => {
        const message: IEndpointMessage = JSON.parse(req.body);
        if (message.type === EndpointMessageType.INITIALIZE) {
          return;
        }

        this.onmessage?.(message);
      });
    });
  }
  async close(): Promise<void> {
    this.res.end();
  }
  async send(message: IEndpointMessage<JSONRPCMessage>): Promise<void> {
    this.res.write(`data: ${JSON.stringify(message)}\n`);
  }
  onmessage?: ((message: IEndpointMessage<JSONRPCMessage>) => void) | null | undefined;
  onclose?: (() => void) | null | undefined;
  onerror?: ((error: Error) => void) | null | undefined;
}
