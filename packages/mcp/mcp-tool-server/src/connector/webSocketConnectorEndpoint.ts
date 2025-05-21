import {
  JSONRPCMessageSchema,
  JSONRPCResponse,
  JSONRPCRequest,
  JSONRPCMessage,
} from '@modelcontextprotocol/sdk/types.js'
import { EndpointOptions, IConnectorEndpoint } from './type'

export class WebSocketConnectorEndpoint implements IConnectorEndpoint {
  clientId!: string

  private url: URL

  private socket!: WebSocket

  constructor(options: EndpointOptions) {
    this.url = options.url
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        this.socket = new WebSocket(this.url)
      }

      this.socket.onopen = () => {
        console.log('WebSocket connected')
        resolve()
      }

      this.socket.onerror = (event) => {
        const error =
          'error' in event
            ? (event.error as Error)
            : new Error(`WebSocket error: ${JSON.stringify(event)}`)

        reject(error)
        this.onerror(error)
      }

      this.socket.onclose = () => {
        this.onclose()
      }

      this.socket.onmessage = (event: MessageEvent) => {
        let message: JSONRPCMessage

        try {
          message = JSONRPCMessageSchema.parse(JSON.parse(event.data))
        } catch (error) {
          this.onerror(error as Error)
          return
        }

        this.onmessage(message)
      }
    })
  }

  async start(): Promise<void> {
    await this.connect()
    const message: JSONRPCMessage = {
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
    }
    this.send(message)
  }

  send(message: JSONRPCMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Invaild WebSocket'))
        return
      }

      ;(message as JSONRPCRequest).id = this.clientId || 0

      this.socket.send(JSON.stringify(message))
      resolve()
    })
  }

  async close(): Promise<void> {
    this.socket?.close()
  }

  onmessage(message: JSONRPCMessage) {
    console.log('Client receive msg: ', message)
    const msg = message as JSONRPCResponse
    if (msg.result?.method === 'initialize') {
      this.clientId = msg.result?.clientId as string
    }
  }

  onclose() {
    console.log('WebSocket Closed')
  }

  onerror(error: Error) {
    console.error('Error:', error)
  }
}
