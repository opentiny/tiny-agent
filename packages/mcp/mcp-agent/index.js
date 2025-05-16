import express from 'express';
import dotenv from 'dotenv';
import { createMCPClient } from '../mcp-client-core/dist/index.js';
import cors from 'cors';

dotenv.config();

const main = async () => {
  const client = await createMCPClient({
    llmConfig: {
      apiKey: process.env.OPEN_ROUTER_API_KEY,
      model: process.env.OPEN_ROUTER_MODEL,
      systemPrompt: '使用中文进行交流。',
      iterationCount: 3,
    },
    mcpServerConfig: {
      url: 'http://localhost:3005/sse?client=355748d-8f49-4e7b-8f5a-2ba44dcc5cda',
    },
  });

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.post('/chat', async (req, res) => {
    const response = await client.processQuery(req.body.query);

    // 这里可以接入你的 chat 逻辑
    res.json(response);
  });

  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Chat server listening on port ${PORT}`);
  });
};

main();
