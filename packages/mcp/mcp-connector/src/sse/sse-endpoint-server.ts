import * as http from 'node:http';
import { ConnectorCenter } from '../connector-center';
import { EndpointMessageType } from '../endpoint.type';
import { genId } from '../utils';
import { SSEServerEndpoint } from './sse-server-endpoint';

export class SSEEndpointServer {
  public app: http.Server;
  protected port: number;
  protected connectorCenter: ConnectorCenter<SSEServerEndpoint>;

  constructor(config: { port: number }, connectorCenter: ConnectorCenter<SSEServerEndpoint>) {
    this.app = http.createServer();
    this.port = config.port;
    this.connectorCenter = connectorCenter;
  }

  start() {
    this.app.listen(this.port);
    this.app.on('request', (req, res) => {
      if (req.method === 'OPTIONS' && req.url === '/client') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': '*',
          'Access-Control-Allow-Headers': '*',
        });
        return res.end();
      }
      if (req.url === '/client') {
        const clientId = genId();
        const endpoint = new SSEServerEndpoint(this.app, res, clientId);

        endpoint.start();

        this.connectorCenter.setClient(clientId, endpoint);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.write(
          'data: ' +
            JSON.stringify({
              type: EndpointMessageType.INITIALIZE,
              data: {
                clientId,
              },
            }) +
            '\n\n',
        );
      }
    });
  }
}
