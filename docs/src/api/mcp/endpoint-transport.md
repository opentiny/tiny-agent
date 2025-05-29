# EndpointTransport

## 介绍

EndpointTransport 实现了MCP标准化的Transport协议，用于MCP Server与通信层客户端进行访问

## 使用示例

采用WebSocket通信作为示例

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
