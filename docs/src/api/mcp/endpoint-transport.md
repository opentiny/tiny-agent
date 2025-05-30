# EndpointTransport

## 介绍

EndpointTransport 实现了 MCP 标准化的 Transport 协议，内置通信层端点用于 MCP Server 与通信层进行访问

## 示例

以下用 WebSocket 通信作为示例，入参为工厂方法，用以构造通信层端点

```typescript
function getWebSocketClientEndpoint() {
  return new WebSocketClientEndpoint({ url: 'ws://localhost:8082' })
}

const endpointTransport = new EndpointTransport(getWebSocketClientEndpoint)
const mcpServer = new McpServer({
  name: 'MCP Service',
  version: '1.0.0'
})

mcpServer.connect(endpointTransport)
```

## 拓展

- 如果需要使用其他通信层协议，可以替换 EndpointTransport 构造函数入参的工厂方法来构造其他通信层实例。
- 需要注意的是需要自行开发维护相应的通信层服务端，通信层需要以 IConnectorEndpoint 协议为标准
