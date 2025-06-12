# MCP Client Chat

一个基于 TypeScript 的 Model Context Protocol (MCP) 客户端实现，支持与 LLM 集成。

- **安装**

```bash
npm install @opentiny/tiny-agent-mcp-client-chat --save
```

- **参数说明**

  - `llmConfig(object)`: LLM 配置项

    - `url(string)`: AI 平台 API 接口地址
    - `apiKey(string)`: AI 平台的 API Key
    - `model(string)`: 模型名称
    - `systemPrompt(string)`: 系统提示词

  - `maxIterationSteps(number)`: Agent 最大迭代步数

  - `mcpServersConfig(object)`: mcp-server 配置项

    - `mcpServers(object)`: mcp-server 基础配置

      - `<serverName(string)>`: mcp-server 服务名

        - `url(string)`: mcp-server 连接地址
        - `headers(object)`: 请求头
        - `timeout(number)`: 超时时长

- **示例**

```typescript
import express from "express";
import cors from "cors";
import { createMCPClientChat } from "@opentiny/tiny-agent-mcp-client-chat";

async function main() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.post("/chat", async (req, res) => {
    const mcpClientChat = await createMCPClientChat({
      llmConfig: {
        url: "https://openrouter.ai/api/v1/chat/completions",
        apiKey: "<your-api-key>",
        model: "mistralai/mistral-7b-instruct:free",
        systemPrompt: "You are a helpful assistant with access to tools.",
      },
      maxIterationSteps: 3,
      mcpServersConfig: {
        mcpServers: {
          "localhost-mcp": {
            url: `xxx`,
            headers: {},
            timeout: 60
          },
          "localhost-mcp2": {
            url: `xxx2`,
            headers: {},
            timeout: 60
          },
        },
      },
    });

    try {
      // 流式数据返回
      const streamResponse = await mcpClientChat.chat("your question...");

      streamResponse.pipe(res);
    } catch (error) {
      // 错误处理
    }
  });
}

main();
```
