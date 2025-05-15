import express from "express";
import dotenv from "dotenv";
import { createMCPClient } from "../mcp-client-core/dist/index.js";

dotenv.config();

const main = async () => {
  const client = await createMCPClient({
    llmConfig: {
      apiKey: process.env.OPEN_ROUTER_API_KEY,
      model: process.env.OPEN_ROUTER_MODEL,
      systemPrompt: "You are a helpful assistant with access to tools.",
      iterationCount: 3,
    },
    mcpServerConfig: {
      url: "http://localhost:3000/mcp",
    },
  });

  const app = express();
  app.use(express.json());

  app.post("/chat", async (req, res) => {
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
