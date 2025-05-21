import { WebSocketConnectorEndpoint } from './WebSocketConnectorEndpoint'
import { EndpointOptions, Endpoint, IConnectorEndpoint } from './type'

type FactoryConstructor<T> = new (options: EndpointOptions) => T

export class EndpointFactory {
  private endPointMap: { [k: string]: FactoryConstructor<IConnectorEndpoint> }

  private options: EndpointOptions

  constructor(options: EndpointOptions) {
    this.endPointMap = {
      [Endpoint.WebSocket]: WebSocketConnectorEndpoint,
    }
    this.options = options
  }

  createEndpoint(endpoint: Endpoint) {
    return new this.endPointMap[endpoint](this.options)
  }
}
