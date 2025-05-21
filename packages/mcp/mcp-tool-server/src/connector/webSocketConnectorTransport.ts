import { JSONRPCResponse } from '@modelcontextprotocol/sdk/types.js'
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { Endpoint, IConnectorEndpoint } from './type'
import { EndpointFactory } from './EndPointFactory'

export class WebSocketConnectorTransport implements Transport {
  private connectorEndpoint: IConnectorEndpoint

  constructor(endpointFactor: EndpointFactory) {
    this.connectorEndpoint = endpointFactor.createEndpoint(Endpoint.WebSocket)
  }

  start(): Promise<void> {
    return this.connectorEndpoint.start()
  }

  send(message: JSONRPCResponse): Promise<void> {
    return this.connectorEndpoint.send(message)
  }

  async close(): Promise<void> {
    this.connectorEndpoint?.close()
  }
}
