# WebsocketEndpointServer

WebSocket 服务端

## 使用

```typescript
const connectorCenter = new ConnectorCenter<WebSocketServerEndpoint>()
const webSocketEndpointServer = new WebSocketEndpointServer({ port: 8082 }, connectorCenter)
webSocketEndpointServer.start()
```

## 方法

### start

启动 WebSocket 服务端，建立通信连接，处理初始化消息发送 ClientId

- **示例**

```typescript
webSocketEndpointServer.start()
```
