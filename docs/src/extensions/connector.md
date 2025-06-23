# 自定义Connector

本章节主要介绍如何实现一个自定义的通信层Connector，用以客户端与MCP服务端之间进行通信访问

## 自定义服务端

服务端通信需要以 TinyAgent 规定的 IConnectorEndpoint 协议为基础，当然客户端也是基于此协议进行拓展。
IConnectorEndpoint 协议要求服务端关注消息的接收发送以及启动（初始化）服务端实例，以下是 IConnectorEndpoint 协议的内容

```typescript
interface IConnectorEndpoint {
  clientId: string | number;
  clientIdResolved: Promise<string | number>;

  start(): Promise<void>;
  close(): Promise<void>;

  send(message: IEndpointMessage): Promise<void>;
  onmessage?: ((message: IEndpointMessage) => void) | null;

  onclose?: (() => void) | null;
  onerror?: ((error: Error) => void) | null;
}
```

接下来基于 IConnectorEndpoint 协议实现服务端，服务端主要关注于通信，通信方式使用SSE通信方法

```typescript
import * as http from 'node:http';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types';
import { EndpointMessageType, IConnectorEndpoint, IEndpointMessage } from '../endpoint.type';

class SSEServerEndpoint implements IConnectorEndpoint {
  protected app: http.Server;
  protected res: any;
  public clientId: string;
  public clientIdResolved: Promise<string>;

  constructor(app: http.Server, res: any, clientId: string) {
    this.app = app;
    this.res = res;
    this.clientId = clientId;
    this.clientIdResolved = Promise.resolve(clientId);
  }

  start(): Promise<void> {
    return new Promise(() => {
      // 订阅http请求
      this.app.on('request', (req, res) => {
        // 定义/message api 用以接收客户端的请求内容
        if (req.url === '/message') {
          // 解决跨域问题
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', '*');

          // 读取请求体
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });

          // 响应请求
          req.on('end', () => {
            try {
              const message = JSON.parse(body);
              if (message.type === EndpointMessageType.INITIALIZE) {
                res.end();
                return;
              }

              this.onmessage?.(message);
            } finally {
              res.end();
            }
          });
        }
      });
    });
  }
  // 关闭SSE连接
  async close(): Promise<void> {
    this.res.end();
  }
  // 使用SSE连接向客户端推送消息
  async send(message: IEndpointMessage<JSONRPCMessage>): Promise<void> {
    this.res.write(`data: ${JSON.stringify(message)}\n`);
  }
  onmessage?: ((message: IEndpointMessage<JSONRPCMessage>) => void) | null | undefined;
  onclose?: (() => void) | null | undefined;
  onerror?: ((error: Error) => void) | null | undefined;
}
```

为使模块责任清晰，服务端的启动以及ClientId的初始化工作交给了Server模块，该模块并不负责通信，以下是Server模块的代码示例

```typescript
import * as http from 'node:http';
import { ConnectorCenter } from '../connector-center';
import { EndpointMessageType } from '../endpoint.type';
import { genId } from '../utils';
import { SSEServerEndpoint } from './sse-server-endpoint';

class SSEEndpointServer {
  public app: http.Server;
  protected connectorCenter: ConnectorCenter<SSEServerEndpoint>;

  constructor(config: { port: number }, connectorCenter: ConnectorCenter<SSEServerEndpoint>) {
    // 启动http服务器
    this.app = http.createServer();
    this.connectorCenter = connectorCenter;
    this.app.listen(config.port);
  }

  start() {
    this.app.on('request', (req, res) => {
      // 定义/client api用以初始化ClientId
      if (req.url === '/client') {
        const clientId = genId();
        const endpoint = new SSEServerEndpoint(this.app, res, clientId);

        endpoint.start();

        this.connectorCenter.setClient(clientId, endpoint);

        // SSE方式通信
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        // 解决跨域问题
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', '*');
        // 推送初始化的ClientId
        res.write(
          'data: ' +
            JSON.stringify({
              type: EndpointMessageType.INITIALIZE,
              data: {
                clientId,
              },
            }) +
            '\n\n',
        );
      }
    });
  }
}
```

## 自定义客户端

下面是SSE客户端的实现，同意基于IConnectorEndpoint 协议

```typescript
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types';
import { EndpointMessageType, IConnectorEndpoint, IEndpointMessage } from '../endpoint.type';

class SSEClientEndpoint implements IConnectorEndpoint {
  public clientId!: string | number;
  public clientIdResolved: Promise<string | number>;
  protected clientIdResolver!: (id: string | number) => void;
  // SSE连接实例
  protected eventSource!: EventSource;
  // SSE连接url
  protected url: string;
  // SSE连接配置项
  protected config?: EventSourceInit;

  constructor(url: string, config?: EventSourceInit) {
    this.url = url;
    this.config = config;
    this.clientIdResolved = new Promise((resolve) => {
      this.clientIdResolver = resolve;
    });
  }
  start(): Promise<void> {
    return new Promise((resolve) => {
      // 创建SSE连接实例
      this.eventSource = new EventSource(this.url, this.config);

      this.eventSource.onopen = () => {};

      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        this.onerror?.(error as any);
      };

      // 接收服务端消息
      this.eventSource.onmessage = (messageEvent: MessageEvent<string>) => {
        const message: IEndpointMessage = JSON.parse(messageEvent.data);
        if (message.type === EndpointMessageType.INITIALIZE) {
          this.clientId = (message.data as any).clientId;
          this.clientIdResolver(this.clientId);
          resolve();
          return;
        }
        this.onmessage?.(message);
      };
    });
  }
  async close(): Promise<void> {
    this.eventSource.close();
    this.onclose?.();
  }
  // 由于SSE是用以服务端向客户端推送消息，后续客户端主动请求则是以HTTP进行
  async send(message: IEndpointMessage<JSONRPCMessage>): Promise<void> {
    if (message.type !== EndpointMessageType.INITIALIZE) {
      await this.clientIdResolved;
    }

    const url = URL.parse(this.url);

    // 请求/message api 向服务端发送请求
    fetch(`${url?.origin}/message`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }
  onmessage?: ((message: IEndpointMessage<JSONRPCMessage>) => void) | null | undefined;
  onclose?: (() => void) | null | undefined;
  onerror?: ((error: Error) => void) | null | undefined;
}
```
