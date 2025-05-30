<p align="center">
  <a href="" target="_blank" rel="noopener noreferrer">
    <img alt="OpenTiny TinyAgent Logo" src="./docs/src/public/logo.svg" height="100" style="max-width:100%;vertical-align: middle">
    <span style="font-size: 36px; vertical-align: middle; margin-left: 24px">OpenTiny TinyAgent</span>
  </a>
</p>
<p align="center"> 基于MCP协议使AI理解与操作用户界面，完成用户任务。</p>

[English](README.md) | 简体中文

## 🌈 特性

- **支持MCP协议** 支持MCP客户端 + FunctionCall/ReAct模式的大模型
- **任务调度指令** 支持模拟人机交互，让AI操作用户界面，可人为干预
- **可扩展操作哭** 丰富的人机交互模拟，支持组件模块API专有扩展
- **开发工具套件** 轻松标记编排，生成AI能理解的网站使用说明书


## 如何使用

### 使用MCP server

**在后端中使用**

执行以下命名安装后端所需依赖
```bash
npm i @opentiny/tiny-agent-mcp-proxy-server @opentiny/tiny-agent-mcp-connector -S
```

使用：
```js
import { ProxyServer } from '@opentiny/tiny-agent-mcp-proxy-server';
import {  ConnectorCenter, WebSocketEndpointServer } from '@opentiny/tiny-agent-mcp-connector';

// 创建一个代理服务器
const server = new ProxyServer()

// 创建一个websocket链接器，用于链接前端
const connectorCenter = new ConnectorCenter<WebSocketServerEndpoint>();
const webSocketEndpointServer = new WebSocketEndpointServer({ port: 8082 }, connectorCenter);
webSocketEndpointServer.start();

// mcp server链接connector
server.setEndPoint(connectorCenter.getClient(clientId, sessionId)); //请求或其他渠道获取的clientId, sessionId
server.setVerifyCode(verifyCode); // 设置校验码
server.connect(transport); // 链接transport, transport需自行实现
```

**在前端中使用**

执行以下命名下载依赖：
```bash
npm i @opentiny/tiny-agent-mcp-service-vue @opentiny/tiny-agent-mcp-service @opentiny/tiny-agent-mcp-connector @opentiny/tiny-agent-task-mcp -S
```

新增一个静态MCP工具配置文件
```json
{
  "tools": [
    {
      "name": "fillName",
      "description": "输入姓名",
      "inputSchema": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "用户名"
          }
        }
      },
      "task": {
        "instructions": [
          {
            "action": "input",
            "params": {
              "selector": ".user-input input",
              "value": "{{name}}"
            }
          }
        ]
      }
    }
  ]
}
```


```js
import { setupMcpService, useMcpService } from '@opentiny/tiny-agent-mcp-service-vue';
import { McpValidator } from '@opentiny/tiny-agent-mcp-service';
import {
  EndpointTransport,
  WebSocketClientEndpoint,
} from '@opentiny/tiny-agent-mcp-connector';
import {
  executableTaskSchema,
  McpToolParser,
} from '@opentiny/tiny-agent-task-mcp';


const mcpValidator = new McpValidator();
const mcp = setupMcpService();
// 链接后台
function getWebSocketClientEndpoint() {
  return new WebSocketClientEndpoint({ url: 'ws://localhost:8082' });
}
const endpointTransport = new EndpointTransport(getWebSocketClientEndpoint);
mcp.mcpServer.connect(endpointTransport);
mcp.setValidator(mcpValidator);

// 提取工具并注册
new McpToolParser(doTask).extractAllTools(mcpToolJson).forEach((tool) => {
  mcp.mcpServer.registerTool(tool.name, tool.config, tool.cb);
});


const { tool } = useMcpService();
const log = () => console.log('log tool')
// 动态注册一个 MCP 工具
tool(
  'name',
  'description',
  { }, // 参数校验，可配合zod使用
  () => {
    log()
  }
);
```

### 使用MCP Client Chat

**安装依赖**

执行以下命名安装依赖
```bash
npm i @opentiny/tiny-agent-mcp-client-chat -S
```

**使用**

```js
const mcpClientChat = await createMCPClientChat({
  llmConfig: {
    url: "https://openrouter.ai/api/v1/chat/completions", // llm接口
    apiKey: "<your-api-key>",
    model: "mistralai/mistral-7b-instruct:free",
    systemPrompt: "You are a helpful assistant with access to tools.",
  },
  maxIterationSteps: 3, // 最大迭代次数
  mcpServersConfig: {  // 配置链接多个MCP Server
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
```

### 使用调度器

**安装依赖**

调取器需要配合操作库一起使用，执行以下命名安装tiny-agent的调度器和官方操作库

```bash
npm i @opentiny/tiny-agent-task-runtime-service @opentiny/tiny-agent-task-action-lib -S
```

**使用**
可以直接在`main.js`中引入并使用
```js
import {
  BaseActions,
  FormActions,
  VueRouterActions,
  GuideActions,
  AxiosActions,
  TinyVueActions
} from '@opentiny/tiny-agent-task-action-lib';
import { createScheduler } from '@opentiny/tiny-agent-task-runtime-service';

// 创建调取器以及接入操作库
export const { taskScheduler, actionManager } = createScheduler(
  [
    ...BaseActions,
    ...FormActions,
    ...VueRouterActions,
    ...GuideActions,
    ...AxiosActions,
    ...TinyVueActions,
  ],
  {} // 可自行提供上下文给操作库使用, 如axios以及router
);
```

## 开发

### 安装所需的依赖

```sh
$ pnpm install
```

### 本地开发

#### 环境配置

```env
# demo-server/.env
# AI 平台 API 请求地址
url=https://openrouter.ai/api/v1/chat/completions
# AI 平台 API Key
apiKey=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
# 使用的模型名称
model=mistralai/mistral-7b-instruct:free
# 系统提示词
systemPrompt=You are a helpful assistant with access to tools.
```

#### 启动 demo 服务器

```sh
pnpm dev:demo-server
```

#### 启动 demo 前端工程

```sh
pnpm dev:demo
```

浏览器自动打开前端页面： `http://localhost:5173/`

### 参与贡献

如果你对我们的开源项目感兴趣，欢迎加入我们！🎉

参与贡献之前请先阅读[贡献指南](CONTRIBUTING.zh-CN.md)。
