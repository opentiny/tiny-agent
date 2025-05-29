import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'

export interface IEndpointMessage<T = JSONRPCMessage> {
  type: 'initialize' | 'message' | string;
  data?: T;
  extra?: any;
}

export interface IConnectorEndpoint {
  clientId: string | number;
  clientIdResolved: Promise<string | number>;

  start(): Promise<void>;
  close(): Promise<void>;

  send(message: IEndpointMessage): Promise<void>;
  onmessage?: ((message: IEndpointMessage) => void) | null;

  onclose?: (() => void) | null;
  onerror?: ((error: Error) => void) | null;
}

