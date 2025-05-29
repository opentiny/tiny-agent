# MCP Proxy Server

一个基于给予 MCP Connector Endpoint 的远程 MCP Server 代理方案，可以对接各类 ServerTransport。

## 用法


## 方法

### connect

用于连接 MCPServer 端 Transport

- **详细信息**

  连接到已有的 SSEServerTransport / StreamableHTTPServerTransport 等 MCPServer 端 Transport，将会接收Transport的消息与Endpoint消息互相发送


- **示例**

```typescript
const server = new ProxyServer();
server.connect(new SSEServerTransport(...))
```

### setEndpoint

设置连接到 MCP Connector 的 Endpoint， 将通过 Endpoint与远程 MCPServer 通信

- **示例**

```typescript
const server = new ProxyServer();
server.setEndpoint(new WebSocketServerEndpoint(...))

```

## setVerifyCode

设置验证信息

- **详细信息**

用于回传验证信息，保证消息是用户主动发送的， 验证信息目前的方案会放在extra.authInfo.extra.verifyCode

- **示例**

```typescript
import { v4 as uuidv4 } from'uuid';
const server = new ProxyServer();
const verifyCode = uuidv4();
server.setVerifyCode(verifyCode);

```

