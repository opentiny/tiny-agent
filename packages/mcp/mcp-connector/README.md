# MCP Connector

## 核心概念

### ConnectorCenter

#### 概念

本质上，ConnectorCenter 是用于维护管理通信层多端的管理器

#### 方法

##### getClient

获取通信层端点
通常用于 ProxyServer 接收到 MCP Client 的请求时会使用该 API 获取已建立起通信的客户端句柄

- **示例**

```typescript
const connectorCenter = new ConnectorCenter();
connectorCenter.getClient('clientId');
```

##### setClient

通常用于建立通信时，建立 Client 的映射

- **示例**

```typescript
const connectorCenter = new ConnectorCenter();
connectorCenter.setClient('clientId', socket);
```

##### removeClient

通常用于通信连接断开时移除 Client

- **示例**

```typescript
const connectorCenter = new ConnectorCenter();
connectorCenter.removeClient('clientId');
```

### ConnectorEndpoint

基于IConnectorEndpoint协议标准的通信层，用于ClientID注册以及任务调度通信，接下来以WebSocket通信为例子介绍

#### WebsocketClientEndpoint

基于 IConnectorEndpoint 协议标准的 WebSocket 通信层客户端

##### 使用

```typescript
const webSocketClientEndpoint = new WebSocketClientEndpoint({ url: 'ws://localhost:8082' });
```

##### 方法

###### start

启动 WebSocket 客户端

- **示例**

```typescript
webSocketClientEndpoint.start();
```

###### close

关闭 WebSocket 客户端连接

- **示例**

```typescript
webSocketClientEndpoint.close();
```

###### send

客户端发送消息

- **示例**

```typescript
webSocketClientEndpoint.send();
```

#### WebsocketServerEndpoint

基于 IConnectorEndpoint 协议标准的 WebSocket 通信层服务端

##### 说明

WebsocketServerEndpoint 只负责消息的处理以及端点的关闭，初始化过程详见 WebsocketEndpointServer API 文档

##### 使用

```typescript
const webSocketServerEndpoint = new WebSocketServerEndpoint(ws, clientId, serverId);
```

##### 方法

###### start

启动 WebSocket 服务端，处理消息接收

- **示例**

```typescript
webSocketServerEndpoint.start();
```

###### close

关闭 WebSocket 服务端连接

- **示例**

```typescript
webSocketServerEndpoint.close();
```

###### send

服务端发送消息

- **示例**

```typescript
webSocketServerEndpoint.send();
```

### EndpointTransport

#### 介绍

EndpointTransport 实现了 MCP 标准化的 Transport 协议，内置通信层端点用于 MCP Server 与通信层进行访问

#### 示例

以下用 WebSocket 通信作为示例，入参为工厂方法，用以构造通信层端点

```typescript
function getWebSocketClientEndpoint() {
  return new WebSocketClientEndpoint({ url: 'ws://localhost:8082' });
}

const endpointTransport = new EndpointTransport(getWebSocketClientEndpoint);
const mcpServer = new McpServer({
  name: 'MCP Service',
  version: '1.0.0',
});

mcpServer.connect(endpointTransport);
```

#### 拓展

- 如果需要使用其他通信层协议，可以替换 EndpointTransport 构造函数入参的工厂方法来构造其他通信层实例。
- 需要注意的是需要自行开发维护相应的通信层服务端，通信层需要以 IConnectorEndpoint 协议为标准
