# MCP TypeScript Client

一个基于 TypeScript 的 Model Context Protocol (MCP) 客户端实现，支持与 LLM 集成。

## 功能特点

- 支持与 MCP 服务器通信
- 集成 OpenRouter API
- 支持工具调用和响应处理
- 完整的 TypeScript 类型支持

## 安装

```bash
npm install
```

## 环境配置

创建 `.env` 文件并配置以下环境变量：

模型选择：https://openrouter.ai/models

```env
OPEN_ROUTER_API_KEY=your_api_key_here # api key
OPEN_ROUTER_MODEL=mistralai/mistral-7b-instruct:free # 模型名称
```

## 使用方法

```typescript
import { createMCPClient } from "@opentiny/tiny-agent-mcp-client-core";

async function example() {
  // 创建客户端实例
  const client = await createMCPClient({
    llmConfig: { // llm 配置项
      apiKey: process.env.OPEN_ROUTER_API_KEY,
      model: process.env.OPEN_ROUTER_MODEL,
      systemPrompt: "You are a helpful assistant with access to tools.",
    },
    maxIterationSteps: 3, // Agent最大迭代步数
    mcpServersConfig: { // mcp-server 配置项
      mcpServers: {
        "localhost-mcp": {
          url: `xxx`,
          headers: {},
          timeout: 60,
          sse_read_timeout: 300,
        },
        "localhost-mcp2": {
          url: `xxx2`,
          headers: {},
          timeout: 60,
          sse_read_timeout: 300,
        },
      },
    },
  });

  try {
    // 处理查询
    const result = await client.chat("你的问题");
    console.log(result.text); // 文本响应
    console.log(result.toolResults); // 工具调用结果
  }
}
```

## 开发

### 构建

```bash
npm run build
```

## 注意事项

1. 确保 MCP 服务器 url 正确
2. 正确配置 OpenRouter API 密钥
3. 注意错误处理

## 许可证

MIT
