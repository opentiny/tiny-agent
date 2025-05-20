import express from 'express';
import path, { dirname } from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import TinyAgentMcpServer from '@opentiny/tiny-agent-mcp-tool-server/src/mcp/server';
import SocketServer from '@opentiny/tiny-agent-mcp-tool-server/src/socket/server';
import { createMCPClient } from '@opentiny/tiny-agent-mcp-client-core';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const clientMap = new Map();

export const main = async () => {
  let config;
  try {
    const configPath = path.resolve(process.cwd(), 'server.config.json');
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log(config);
  } catch (error) {
    console.error(`无法加载配置文件: 'server.config.json'`);
    console.error(error.message);
    process.exit(1);
  }
  const app = express();
  app.use(cors());
  app.use(express.json());
  const { port, apiKey, model } = config;
  try {
    const socketServer = new SocketServer.default(port);
    const mcpServer = new TinyAgentMcpServer.default(socketServer);
    const filePath = path.resolve(__dirname, '..', 'mcp-tool.json');

    socketServer.start();
    mcpServer.start(filePath);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Chat server listening on port ${port}`);
  });

  app.post('/chat', async (req, res) => {
    const clientId = req.body.clientId;
    let client = clientMap.get(clientId);
    if (!client) {
      client = await createMCPClient({
        llmConfig: {
          apiKey,
          model,
          systemPrompt: '使用中文进行交流。',
          iterationCount: 3,
        },
        mcpServerConfig: {
          url: `http://localhost:3077/sse?client=${clientId}`,
        },
      });
      clientMap.set(clientId, client);
    }

    const response = await client.processQuery(req.body.query);

    // 这里可以接入你的 chat 逻辑
    res.json(response);
  });
};

main();
