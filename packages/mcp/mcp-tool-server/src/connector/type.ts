import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'

export type EndpointOptions = {
  url: URL
}

export enum Endpoint {
  WebSocket = 'WebSocket',
}

export interface IConnectorEndpoint {
  clientId: string | number

  start(): Promise<void>

  //TODO options待定义
  send(message: JSONRPCMessage, options?: any): Promise<void>

  close(): Promise<void>

  onclose?: () => void

  onerror?: (error: Error) => void

  onmessage: (message: JSONRPCMessage, extra?: {}) => void
}

export interface IConnectorCenter<V> {
  clientMap: Map<string, V>

  start(): void

  send(clientId: string, message: JSONRPCMessage): Promise<void>

  close(clientId: string): void

  onmessage: (message: JSONRPCMessage, extra?: {}) => void
}
