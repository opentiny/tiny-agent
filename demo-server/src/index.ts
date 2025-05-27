import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ProxyServer } from '@opentiny/tiny-agent-mcp-proxy-server';
import {
  WebSocketServerEndpoint,
  ConnectorCenter,
  WebSocketEndpointServer,
} from '@opentiny/tiny-agent-mcp-connector';

export const genId = () => uuidv4();
function getProxyServer() {
  return new ProxyServer();
}

const connectorCenter = new ConnectorCenter<WebSocketServerEndpoint>();
const webSocketEndpointServer = new WebSocketEndpointServer(
  { port: 8082 },
  connectorCenter
);
webSocketEndpointServer.start();

const transports: { [sessionId: string]: Transport } = {};
const app = express();

const handleSessionRequest = async (
  req: express.Request,
  res: express.Response
) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await (transport as StreamableHTTPServerTransport).handleRequest(req, res);
};

app.get('/mcp', handleSessionRequest);

app.delete('/mcp', handleSessionRequest);

app.post('/mcp', async (req: Request, res: Response) => {
  const server = getProxyServer();
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId] as StreamableHTTPServerTransport;
  } else {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => genId(),
      onsessioninitialized: (sessionId) => {
        transports[sessionId] = transport;
      },
      enableJsonResponse: true,
    });

    transport.onclose = () => {
      if (sessionId) {
        delete transports[sessionId];
      }
    };
    await server.connect(transport);
  }
  await transport.handleRequest(req, res, req.body);
});

app.get('/sse', async (req: Request, res: Response) => {
  const server = getProxyServer();
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
  server.setEndPoint(
    connectorCenter.getClient(req.query.client as string, transport.sessionId)!
  );
  res.on('close', () => {
    delete transports[transport.sessionId];
  });
  await server.connect(transport);
});

app.post('/messages', async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('No transport found for sessionId');
  }
});

app.listen(3001, '0.0.0.0');
