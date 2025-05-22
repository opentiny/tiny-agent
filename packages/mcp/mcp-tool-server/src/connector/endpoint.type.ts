import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'

export interface IEndpointMessage<T = JSONRPCMessage> {
  type: 'initialize' | 'message' | string;
  data?: T;
  extra?: any;
}

export interface IConnectorEndpoint {
  clientId: string | number;

  start(): Promise<void>;
  close(): Promise<void>;

  send(message: IEndpointMessage): Promise<void>;
  onmessage: (message: IEndpointMessage) => void;


  onclose?: () => void;
  onerror?: (error: Error) => void;
}

