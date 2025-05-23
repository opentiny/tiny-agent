# ConnectorCenter

## 概念

本质上，ConnectorCenter 是用于维护管理通信层多客户端的管理器

## Config

### getClient

获取通信层客户端
通常用于 ProxyServer 接收到 MCP Client 的请求时会使用该 API 获取已建立起通信的客户端句柄

- **示例**

```typescript
const connectorCenter = new ConnectorCenter();
connectorCenter.getClient('clientId');
```

### setClient

通常用于建立通信时，通信服务端建立 Client 的映射

- **示例**

```typescript
const connectorCenter = new ConnectorCenter();
connectorCenter.setClient('clientId', socket);
```

### removeClient

通常用于通信连接断开时移除 Client

- **示例**

```typescript
const connectorCenter = new ConnectorCenter();
connectorCenter.removeClient('clientId');
```
