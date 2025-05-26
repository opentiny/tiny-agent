# MCP Agent

一个基于 TypeScript 的 Model Context Protocol (MCP) 客户端实现，支持与 LLM 集成。

## 功能特点

- 支持与 MCP 服务器通信
- 集成 OpenRouter API
- 支持工具调用和响应处理
- 完整的 TypeScript 类型支持

## 安装

```bash
npm install @opentiny/tiny-agent-mcp-agent-core --save
```

## 环境配置

创建 `.env` 文件并配置以下环境变量：

```.env
# api key
OPEN_ROUTER_API_KEY=<your_api_key>
# 模型名称。模型选择：https://openrouter.ai/models
OPEN_ROUTER_MODEL=mistralai/mistral-7b-instruct:free
```

## 使用方法

```typescript
import { createMCPAgent } from '@opentiny/tiny-agent-mcp-agent-core';

async function example() {
  // 创建客户端实例
  const mcpAgent = await createMCPAgent({
    llmConfig: {
      // llm 配置项
      apiKey: process.env.OPEN_ROUTER_API_KEY, // api key
      model: process.env.OPEN_ROUTER_MODEL, // 模型名称
      systemPrompt: 'You are a helpful assistant with access to tools.', // 系统提示词
    },
    maxIterationSteps: 3, // agent最大迭代步数
    mcpServersConfig: {
      // mcp-server 配置项
      mcpServers: {
        // 支持连接多个mcp-server
        'localhost-mcp': {
          url: `xxx`,
          headers: {},
          timeout: 60,
          sse_read_timeout: 300,
        },
        'localhost-mcp2': {
          url: `xxx2`,
          headers: {},
          timeout: 60,
          sse_read_timeout: 300,
        },
      },
    },
  });

  try {
    // chat
    const result = await mcpAgent.chat('你的问题');
    console.log(result.text); // 文本响应
    console.log(result.toolResults); // 工具调用结果
  } catch (error) {
    console.error(error);
  }
}
```

## 注意事项

1. 正确配置 OpenRouter API 密钥
2. 选择合适的大模型
3. 确保 MCP 服务器 url 正确
