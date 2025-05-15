# Tiny Agent

Tiny Agent 是一个基于 MCP (Model Context Protocol) 的智能代理工具集合，支持多种 LLM 模型和工具调用。

## 功能特点

- 支持多种 LLM 模型（OpenAI、Anthropic 等）
- 基于 MCP 协议的工具调用
- 支持 SSE (Server-Sent Events) 实时通信
- 支持流式响应
- 支持工具调用结果反馈
- 简单易用的 API

## 安装

```bash
# 克隆仓库
git clone https://github.com/opentiny/tiny-agent.git
cd tiny-agent

# 安装依赖
pnpm install

# 构建
pnpm build
```

## 使用方法

### 1. 启动工具服务器

```bash
# 启动 JavaScript 工具服务器
node packages/mcp/mcp-tool-server/dist/index.js

# 或启动 Python 工具服务器
python packages/mcp/mcp-tool-server/src/server.py
```

### 2. 创建 MCP 客户端

```typescript
import { createMCPClient } from '@opentiny/tiny-agent';

const client = await createMCPClient({
  serverUrl: 'http://localhost:3000', // 工具服务器地址
  apiKey: 'your-api-key', // OpenRouter API 密钥
  model: 'gpt-4', // 或其他支持的模型
});
```

### 3. 处理查询

```typescript
const result = await client.processQuery('你的问题');
console.log(result.text); // 输出响应文本
console.log(result.toolResults); // 输出工具调用结果
```

### 4. 清理资源

```typescript
await client.cleanup();
```

## 工具服务器

工具服务器支持 SSE 通信方式，可以使用 Python 或 JavaScript 编写。

### Python 示例

```python
from mcp import McpServer
from mcp.transport import SSEServerTransport

server = McpServer()

@server.tool("add", "加法")
def add(a: int, b: int) -> int:
    return a + b

@server.tool("greet", "问候")
def greet(name: str) -> str:
    return f"Hello, {name}!"

# 使用 SSE 传输
transport = SSEServerTransport(port=3000)
server.run(transport)
```

### JavaScript 示例

```javascript
import { McpServer } from '@modelcontextprotocol/sdk';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';

const app = express();
const server = new McpServer();

server.tool('add', '加法', {
  a: 'number',
  b: 'number'
}, async ({ a, b }) => a + b);

server.tool('greet', '问候', {
  name: 'string'
}, async ({ name }) => `Hello, ${name}!`);

// 使用 SSE 传输
const transport = new SSEServerTransport('/sse', app);
server.connect(transport);

app.listen(3000);
```

## 环境变量

- `LLM_API_KEY`: OpenRouter API 密钥

## 开发

### 项目结构

```
tiny-agent/
├── packages/
│   ├── mcp/
│   │   ├── mcp-client/     # MCP 客户端
│   │   ├── mcp-tool-server/ # MCP 工具服务器
│   │   └── vite-mcp-tool-plugin/ # Vite 插件
│   └── ...
├── examples/               # 示例代码
└── ...
```

### 开发命令

```bash
# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test
```

## 贡献

欢迎提交 Pull Request 或创建 Issue。

## 许可证

MIT
