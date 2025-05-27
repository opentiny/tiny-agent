import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { Request, Response } from "express";
import { v4 as uuidv4 } from 'uuid';
import { ProxyServer } from '@opentiny/tiny-agent-mcp-proxy-server';
import { WebSocketServerEndpoint, ConnectorCenter, WebSocketEndpointServer } from '@opentiny/tiny-agent-mcp-connector';

export const genId = () => uuidv4();
function getProxyServer() {
  return new ProxyServer();
}

const connectorCenter = new ConnectorCenter<WebSocketServerEndpoint>();
const webSocketEndpointServer = new WebSocketEndpointServer({ port: 8082 }, connectorCenter);
webSocketEndpointServer.start();

const transports: {[sessionId: string]: SSEServerTransport} = {};
const app = express();

app.get("/sse", async (req: Request, res: Response) => {
  const server = getProxyServer();
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
  server.setEndPoint(connectorCenter.getClient(req.query.client as string, transport.sessionId)!);
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await server.connect(transport);
});

app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('No transport found for sessionId');
  }
});

app.listen(3001, '0.0.0.0');
