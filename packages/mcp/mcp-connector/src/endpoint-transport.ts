import { JSONRPCResponse } from '@modelcontextprotocol/sdk/types.js'
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { IConnectorEndpoint, IEndpointMessage } from './endpoint.type'

export class EndpointTransport implements Transport {
  get clientId(): string | number {
    return this.connectorEndpoint.clientId;
  }
  get clientIdResolved(): Promise<string | number> {
    return this.connectorEndpoint.clientIdResolved;
  }
  protected connectorEndpoint: IConnectorEndpoint;

  constructor(endpointFactory: () => IConnectorEndpoint) {
    this.connectorEndpoint = endpointFactory()
    this.connectorEndpoint.onmessage = (msg: IEndpointMessage) => {
      this.onmessage?.(msg.data!, msg.extra)
    }
  }
  // override by mcp-server
  onmessage: Transport['onmessage'] = undefined;
  onclose: Transport['onclose'] = undefined;
  onerror: Transport['onerror'] = undefined;

  async start(): Promise<void> {
    await this.connectorEndpoint.start()
  }

  async send(message: JSONRPCResponse, options?: any): Promise<void> {
    return this.connectorEndpoint.send({
      type: 'message',
      data: message,
      extra: options,
    })
  }

  async close(): Promise<void> {
    this.connectorEndpoint?.close()
  }
}
 