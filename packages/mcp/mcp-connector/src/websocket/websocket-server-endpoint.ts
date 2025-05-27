import { WebSocket } from 'ws';
import { isJSONRPCRequest, isJSONRPCResponse } from '@modelcontextprotocol/sdk/types.js';
import { IConnectorEndpoint, IEndpointMessage } from '../endpoint.type';


export class WebSocketServerEndpoint implements IConnectorEndpoint {
  public clientId: string;
  public clientIdResolved: Promise<string>;
  public serverId?: string;
  protected ws: WebSocket;

  constructor(ws: WebSocket, clientId: string, serverId?: string) {
    this.ws = ws;
    this.clientId = clientId;
    this.clientIdResolved = Promise.resolve(clientId);
    this.serverId = serverId;
  }
  async start(): Promise<void> {
    this.ws.on('message', (messageStr: string) => {
      const message: IEndpointMessage = JSON.parse(messageStr);
      if (message.type === 'initialize') {
        return
      }
      if (!this.isCurrentServerMessage(message)) {
        return;
      }
      this.restoreMessageId(message);
      this.onmessage?.(message);
    })
  }

  async close(): Promise<void> { 
    this.ws.close();
  }

  async send(message: IEndpointMessage): Promise<void> {
    this.replaceMessageId(message);
    this.ws.send(JSON.stringify(message));
  }

  protected replaceMessageId(message: IEndpointMessage): void {
    if (this.serverId && message.type !== 'initialize' && isJSONRPCRequest(message.data)) {
      message.data.id = `${this.serverId}_${message.data.id}`;
    }
  }
  protected isCurrentServerMessage(message: IEndpointMessage): boolean {
    if (this.serverId && message.type !== 'initialize' && isJSONRPCResponse(message.data) && typeof message.data.id === 'string') {
      return (message.data.id as string).startsWith(`${this.serverId}_`);
    }
    return true;
  }
  protected restoreMessageId(message: IEndpointMessage): void {
    if (this.serverId && message.type !== 'initialize' && isJSONRPCResponse(message.data)) {
      message.data.id = Number((message.data.id as string).replace(`${this.serverId}_`, ''));
    }
  }

  // override by proxy server
  onmessage: IConnectorEndpoint['onmessage'] = null;
  onclose: IConnectorEndpoint['onclose']  = null;
  onerror: IConnectorEndpoint['onerror']  = null;
}
