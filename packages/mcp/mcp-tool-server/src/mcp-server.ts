import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { Request, Response } from "express";
import { ProxyServer } from './proxy-server';
import { runServer } from './test';

function getProxyServer() {
  return new ProxyServer();
}
const { connectorCenter } = runServer();
const transports: {[sessionId: string]: SSEServerTransport} = {};
const app = express();

app.get("/sse", async (req: Request, res: Response) => {
  const server = getProxyServer();
  server.setEndPoint(connectorCenter.getClient(req.query.client as string));
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
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
