import { WebSocketConnectorCenter } from './connector/WebSocketConnectorCenter'
import { WebSocketConnectorEndpoint } from './connector/WebSocketConnectorEndpoint'

const wsServer = new WebSocketConnectorCenter(8082)

wsServer.start()

setTimeout(() => {
  wsClient.start()
}, 2000)

const wsClient = new WebSocketConnectorEndpoint({
  url: new URL('ws://localhost:8082'),
})
