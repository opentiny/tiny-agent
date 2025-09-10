# MCP Client Chat

一个基于 TypeScript 的 Model Context Protocol (MCP) 客户端实现，支持与 LLM 集成。

## 特性

- 🚀 **双模式支持**：支持传统 REST API 和 AI SDK 两种模式
- 🔧 **工具调用**：支持 Function Calling 和 ReAct 两种 Agent 策略
- 📡 **流式响应**：支持实时流式数据返回
- 🔌 **灵活配置**：支持多种 LLM 提供商和自定义传输层
- 🛠️ **MCP 集成**：完整的 MCP 协议支持，可连接多个 MCP 服务器

- **安装**

```bash
npm install @opentiny/tiny-agent-mcp-client-chat --save
```

- **参数说明**

  - `agentStrategy(string, optional)`: Agent 策略，可选值：`'Function Calling'` 或 `'ReAct'`，默认为 `'Function Calling'`

  - `llmConfig(object)`: LLM 配置项

    - `useSDK(boolean, optional)`: 是否使用 AI SDK，默认为 false
    - `url(string)`: AI 平台 API 接口地址，使用 AI SDK 时可不填
    - `apiKey(string)`: AI 平台的 API Key
    - `model(string | LanguageModelV2)`: 模型名称或 AI SDK 模型实例
    - `systemPrompt(string)`: 系统提示词
    - `summarySystemPrompt(string, optional)`: 总结提示词
    - `streamSwitch(boolean, optional)`: 是否使用流式响应，默认为 true
    - `maxTokens(number, optional)`: 最大生成 token 数
    - `temperature(number, optional)`: 温度参数，控制随机性
    - `topP(number, optional)`: Top-p 采样参数
    - `topK(number, optional)`: Top-k 采样参数
    - `presencePenalty(number, optional)`: 存在惩罚参数
    - `frequencyPenalty(number, optional)`: 频率惩罚参数
    - `stopSequences(string[], optional)`: 停止序列
    - `seed(number, optional)`: 随机种子
    - `maxRetries(number, optional)`: 最大重试次数
    - `abortSignal(AbortSignal, optional)`: 中止信号
    - `headers(Record<string, string>, optional)`: 自定义请求头

  - `maxIterationSteps(number)`: Agent 最大迭代步数

  - `mcpServersConfig(object)`: mcp-server 配置项

    - `mcpServers(object)`: mcp-server 基础配置

      - `<serverName(string)>`: mcp-server 服务名

        - `url(string)`: mcp-server 连接地址
        - `headers(object)`: 请求头
        - `timeout(number)`: 超时时长
        - `customTransport(Transport | function, optional)`: 自定义传输层

- **示例**

## REST API 使用示例

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
        summarySystemPrompt: "Please provide a brief summary!",
        streamSwitch: true,
        temperature: 0.7,
        maxTokens: 1000,
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

## AI SDK 使用示例

### 使用 [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)

```typescript
import { createMCPClientChat } from "@opentiny/tiny-agent-mcp-client-chat";
import { createOpenAI } from '@ai-sdk/openai';
// 创建 openai provider
const openai = createOpenAI({
  apiKey: "<your-openai-api-key>", // 通过 Authorization 头部发送的 API 密钥。默认为 OPENAI_API_KEY 环境变量。
  baseURL: "https://api.openai.com/v1", // 用于 API 调用的不同 URL 前缀，例如使用代理服务器。默认前缀是 https://api.openai.com/v1。
  name: "", // 提供商名称。在使用 OpenAI 兼容提供商时，您可以设置此属性来更改模型提供商属性。默认为 openai。
  organization: "", // OpenAI 组织。
  project: "", // OpenAI 项目。
  fetch:  (input: RequestInfo, init?: RequestInit) => Promise<Response>, // 自定义 fetch 实现。默认为全局 fetch 函数。您可以用它作为中间件来拦截请求，或为测试等提供自定义 fetch 实现。
  headers: { // 要包含在请求中的自定义头部。
    'header-name': 'header-value',
  },
});

const mcpClientChat = await createMCPClientChat({
  llmConfig: {
    useSDK: true, // 启用 AI SDK
    model: openai("gpt-4o"), // 使用 AI SDK 模型
    systemPrompt: "You are a helpful assistant with access to tools.",
    temperature: 0.7,
    maxTokens: 1000,
  },
  maxIterationSteps: 3,
  mcpServersConfig: {
    mcpServers: {
      "localhost-mcp": {
        url: "http://localhost:3000",
        headers: {},
        timeout: 60
      },
    },
  },
});
```

### 使用 [DeepSeek](https://ai-sdk.dev/providers/ai-sdk-providers/deepseek)

```.env
DEEPSEEK_API_KEY={your-deepseek-api-key}
```


```typescript
import { createMCPClientChat } from "@opentiny/tiny-agent-mcp-client-chat";
import { deepseek } from '@ai-sdk/deepseek';

const mcpClientChat = await createMCPClientChat({
  llmConfig: {
    useSDK: true, // 启用 AI SDK
    model: deepseek("deepseek-chat"),
    systemPrompt: "You are a helpful assistant with access to tools.",
    temperature: 0.6,
    maxTokens: 1500,
  },
  maxIterationSteps: 3,
  mcpServersConfig: {
    mcpServers: {
      "localhost-mcp": {
        url: "http://localhost:3000",
        headers: {},
        timeout: 60
      },
    },
  },
});
```
