import express, { type Request } from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { createConnector } from './connector';
import { createProxyServer } from './proxy-server';
import { createChat } from './chat';

dotenv.config();

const chatConfigFn = (req: Request) => ({
  llmConfig: {
    url: process.env.url,
    apiKey: process.env.apiKey,
    model: process.env.model,
    systemPrompt: process.env.systemPrompt,
  },
  maxIterationSteps: 3,
  mcpServersConfig: {
    mcpServers: {
      // http with sse(deprecated )
      // 'localhost-mcp': {
      //   url: `http://127.0.0.1:3001/sse?client=${req.headers['connector-client-id'] as string}&code=${req.headers['mcp-verify-code']}`,
      //   headers: {},
      //   timeout: 60
      // },
      'localhost-mcp-streamable-http': {
        url: 'http://127.0.0.1:3001/mcp',
        headers: {
          'connector-client-id': req.headers['connector-client-id'],
          'mcp-verify-code': req.headers['mcp-verify-code'],
        },
        timeout: 60
      },
    },
  },
});

const { connectorCenter, websocketConnectionHandler } = createConnector();
const { sseHandlers, streamableHttpHandlers } = createProxyServer({ connectorCenter });
const { chatHandler } = createChat(chatConfigFn);

const app = express();
expressWs(app);
app.use(cors());

// connector
(app as unknown as expressWs.WithWebsocketMethod).ws('/ws', websocketConnectionHandler);

// mcp server
app.get('/mcp', streamableHttpHandlers.sessionHandler);
app.delete('/mcp', streamableHttpHandlers.sessionHandler);
app.post('/mcp', streamableHttpHandlers.messageHandler);

app.get('/sse', sseHandlers.sessionHandler);
app.post('/messages', sseHandlers.messageHandler);

// chat
app.post('/chat', chatHandler);

app.listen(3001);
