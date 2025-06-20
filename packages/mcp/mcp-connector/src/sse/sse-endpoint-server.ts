import express, { type Request, type Response } from 'express';
import { ConnectorCenter } from '../connector-center';
import { EndpointMessageType } from '../endpoint.type';
import { genId } from '../utils';
import { SSEServerEndpoint } from './sse-server-endpoint';

export class SSEEndpointServer {
  public app: express.Application;
  protected connectorCenter: ConnectorCenter<SSEServerEndpoint>;

  constructor(config: { port: number }, connectorCenter: ConnectorCenter<SSEServerEndpoint>) {
    this.app = express();
    this.connectorCenter = connectorCenter;
    this.app.listen(config.port);
  }

  start() {
    this.app.all('/client', (req: Request, res: Response) => {
      const clientId = genId();
      const endpoint = new SSEServerEndpoint(this.app, res, clientId);

      endpoint.start();

      this.connectorCenter.setClient(clientId, endpoint);
      const message = JSON.parse(req.body);
      if (message.type === EndpointMessageType.INITIALIZE) {
        res.set('Content-Type', 'text/event-stream');
        res.send(
          JSON.stringify({
            type: EndpointMessageType.INITIALIZE,
            data: {
              clientId,
            },
          }),
        );
      }
    });
  }
}
