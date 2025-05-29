import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { ConnectorCenter, IConnectorEndpoint } from '@opentiny/tiny-agent-mcp-connector';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ProxyServer } from '@opentiny/tiny-agent-mcp-proxy-server';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function getProxyServer() {
  return new ProxyServer();
}

export const genId = () => uuidv4();

export function createSSETransportHandler(deps: {
  connectorCenter: ConnectorCenter<IConnectorEndpoint>;
  transports: Record<string, Transport>;
  messageEndpointUrl: string;
}) {
  const {
    connectorCenter,
    transports,
    messageEndpointUrl,
  } = deps;

  const sessionHandler = async (req: Request, res: Response) => {
    const transport = new SSEServerTransport(messageEndpointUrl, res);
    transports[transport.sessionId] = transport;
    const clientId = req.query.client as string;
    const verifyCode = req.query.code as string;
    const server = getProxyServer();
    server.setEndPoint(connectorCenter.getClient(clientId, transport.sessionId)!);
    server.setVerifyCode(verifyCode);
    res.on('close', () => {
      delete transports[transport.sessionId];
    });
    await server.connect(transport);
  }
  const messageHandler = async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId] as SSEServerTransport;
    if (transport) {
      await (transport as SSEServerTransport).handlePostMessage(req, res);
    } else {
      res.status(400).send('No transport found for sessionId');
    }
  }
  return {
    sessionHandler,
    messageHandler
  }
}

export function createSteamableWithHttpHandle<T extends IConnectorEndpoint>(deps: {
  connectorCenter: ConnectorCenter<T>;
  transports: Record<string, Transport>;
}) {
  const {
    connectorCenter,
    transports
  } = deps;

  const sessionHandler = async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    const transport = transports[sessionId];
    await (transport as StreamableHTTPServerTransport).handleRequest(req, res);
  };

  const messageHandler = async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    let transport: Transport;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
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

      const clientId = req.headers['connector-client-id'] as string | undefined;
      const verifyCode = req.headers['mcp-verify-code'] as string | undefined;
      const server = getProxyServer();
      server.setEndPoint(connectorCenter.getClient(clientId!, sessionId)!);
      server.setVerifyCode(verifyCode);
      await server.connect(transport);
    }
    await (transport as StreamableHTTPServerTransport).handleRequest(req, res, req.body);
  }

  return {
    sessionHandler,
    messageHandler,
  }
}

export function createProxyServer(deps: {
  connectorCenter: ConnectorCenter<IConnectorEndpoint>;
  sseMessageEndpointUrl?: string
}) {
  const {connectorCenter, sseMessageEndpointUrl} = deps;
  const transports: { [sessionId: string]: Transport } = {};
  const sseHandlers = createSSETransportHandler({
    connectorCenter,
    transports,
    messageEndpointUrl: sseMessageEndpointUrl || '/messages'
  });
  const streamableHttpHandlers = createSteamableWithHttpHandle({
    connectorCenter,
    transports
  }
  )
  return {
    sseHandlers,
    streamableHttpHandlers
  }
}
