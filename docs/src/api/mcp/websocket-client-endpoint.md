# WebsocketClientEndpoint

基于 IConnectorEndpoint 协议标准的 WebSocket 通信层客户端

## 使用

```typescript
const webSocketClientEndpoint = new WebSocketClientEndpoint({ url: 'ws://localhost:8082' });
```

## 方法

### start

启动 WebSocket 客户端

- **示例**

```typescript
webSocketClientEndpoint.start();
```

### close

关闭 WebSocket 客户端连接

- **示例**

```typescript
webSocketClientEndpoint.close();
```

### send

客户端发送消息

- **示例**

```typescript
webSocketClientEndpoint.send();
```
