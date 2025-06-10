# TinyAgent 如何使用

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
import { EndpointTransport, WebSocketClientEndpoint } from '@opentiny/tiny-agent-mcp-connector';
import { executableTaskSchema, McpToolParser } from '@opentiny/tiny-agent-task-mcp';

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
const log = () => console.log('log tool');
// 动态注册一个 MCP 工具
tool(
  'name',
  'description',
  {}, // 参数校验，可配合zod使用
  () => {
    log();
  },
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
    url: 'https://openrouter.ai/api/v1/chat/completions', // llm接口
    apiKey: '<your-api-key>',
    model: 'mistralai/mistral-7b-instruct:free',
    systemPrompt: 'You are a helpful assistant with access to tools.',
  },
  maxIterationSteps: 3, // 最大迭代次数
  mcpServersConfig: {
    // 配置链接多个MCP Server
    mcpServers: {
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
  TinyVueActions,
} from '@opentiny/tiny-agent-task-action-lib';
import { createScheduler } from '@opentiny/tiny-agent-task-runtime-service';

// 创建调取器以及接入操作库
export const { taskScheduler, actionManager } = createScheduler(
  [...BaseActions, ...FormActions, ...VueRouterActions, ...GuideActions, ...AxiosActions, ...TinyVueActions],
  {}, // 可自行提供上下文给操作库使用, 如axios以及router
);
```
