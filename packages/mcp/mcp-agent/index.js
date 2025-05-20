import express from 'express';
import dotenv from 'dotenv';
import { createMCPClient } from '../mcp-client-core/dist/index.js';
import cors from 'cors';

dotenv.config();

const main = async () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const clientId = '355748d-8f49-4e7b-8f5a-2ba44dcc5cda';
  const client = createMCPClient({
    llmConfig: {
      apiKey: process.env.OPEN_ROUTER_API_KEY,
      model: process.env.OPEN_ROUTER_MODEL,
      systemPrompt: '你是一个有用的工具调用者，使用中文进行交流。',
    },
    maxIterationSteps: 3,
    mcpServersConfig: {
      mcpServers: {
        'localhost-mcp': {
          url: `http://localhost:3005/sse?client=${clientId}`,
          headers: {},
          timeout: 60,
          sse_read_timeout: 300,
        },
      },
    },
  });

  await client.init();

  app.post('/chat', async (req, res) => {

    try {
      const query = req.body.query;
      const response = await client.chat(query);

      res.json(response);
    } catch (error) {
      debugger;
    }
  });

  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Chat server listening on port ${PORT}`);
  });
};

main();
