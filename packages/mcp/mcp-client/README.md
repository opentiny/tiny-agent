# MCP TypeScript Client

一个基于 TypeScript 的 Model Context Protocol (MCP) 客户端实现，支持与 OpenAI 模型集成。

## 功能特点

- 支持与 MCP 服务器通信
- 集成 OpenAI API
- 支持工具调用和响应处理
- 提供交互式聊天界面
- 完整的 TypeScript 类型支持

## 安装

```bash
npm install
```

## 环境配置

创建 `.env` 文件并配置以下环境变量：

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview  # 可选，默认为 gpt-4-turbo-preview
OPENAI_BASE_URL=https://api.openai.com/v1  # 可选，用于自定义 API 端点
```

## 使用方法

### 作为库使用

```typescript
import { createMCPClient } from './index.js';

async function example() {
  // 创建客户端实例
  const client = await createMCPClient({
    serverScriptPath: 'path/to/server.js',
    model: 'gpt-4-turbo-preview',  // 可选
    baseURL: 'https://api.openai.com/v1'  // 可选
  });

  try {
    // 处理查询
    const result = await client.processQuery('你的问题');
    console.log(result.text);  // 文本响应
    console.log(result.toolResults);  // 工具调用结果
  } finally {
    // 清理资源
    await client.cleanup();
  }
}
```

### 运行交互式聊天

```bash
# 编译 TypeScript
npm run build

# 运行客户端
node dist/index.js path/to/server.js
```

### 运行测试

```bash
# 运行测试脚本
node dist/test.js
```

## API 参考

### MCPClientOptions

客户端配置选项：

```typescript
interface MCPClientOptions {
  serverScriptPath: string;  // MCP 服务器脚本路径
  model?: string;           // OpenAI 模型名称
  baseURL?: string;         // OpenAI API 基础 URL
}
```

### processQuery 方法

处理用户查询并返回响应：

```typescript
async processQuery(query: string): Promise<{
  text: string;            // AI 响应文本
  toolResults: Array<{     // 工具调用结果
    call: string;          // 工具名称
    result: unknown;       // 工具返回结果
  }>;
}>
```

## 示例

### 基本使用

```typescript
import { createMCPClient } from './index.js';

async function main() {
  const client = await createMCPClient({
    serverScriptPath: './scripts/weather.tool.js'
  });

  try {
    const result = await client.processQuery('What\'s the weather like in California?');
    console.log(result.text);
  } finally {
    await client.cleanup();
  }
}
```

### 错误处理

```typescript
try {
  const result = await client.processQuery('your query');
  console.log(result.text);
} catch (error) {
  console.error('Error:', error);
} finally {
  await client.cleanup();
}
```

## 开发

### 构建

```bash
npm run build
```

### 测试

```bash
# 运行测试
node dist/test.js
```

## 注意事项

1. 确保 MCP 服务器脚本路径正确
2. 正确配置 OpenAI API 密钥
3. 适当处理资源清理
4. 注意错误处理

### 抹平llm差异
https://github.com/nanbingxyz/5ire/tree/main/src/intellichat/services

## 许可证

MIT