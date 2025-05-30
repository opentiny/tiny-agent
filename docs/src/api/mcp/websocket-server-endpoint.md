# WebsocketServerEndpoint

基于 IConnectorEndpoint 协议标准的 WebSocket 通信层服务端

## 说明

WebsocketServerEndpoint 只负责消息的处理以及端点的关闭，初始化过程详见 WebsocketEndpointServer API 文档

## 使用

```typescript
const webSocketServerEndpoint = new WebSocketServerEndpoint(ws, clientId, serverId);
```

## 方法

### start

启动 WebSocket 服务端，处理消息接收

- **示例**

```typescript
webSocketServerEndpoint.start();
```

### close

关闭 WebSocket 服务端连接

- **示例**

```typescript
webSocketServerEndpoint.close();
```

### send

服务端发送消息

- **示例**

```typescript
webSocketServerEndpoint.send();
```
