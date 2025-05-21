import { WebSocket, WebSocketServer } from 'ws'
import {
  JSONRPCRequestSchema,
  JSONRPCRequest,
  JSONRPCResponse,
} from '@modelcontextprotocol/sdk/types.js'
import { genClientId } from '../utils/genClientId'

export class WebSocketConnectorCenter {
  clientMap: Map<string, WebSocket>

  private wss!: WebSocketServer

  private port: number

  constructor(port: number) {
    this.clientMap = new Map()
    this.port = port
  }

  private getClient(clientId: string) {
    return this.clientMap.get(clientId)
  }

  start() {
    this.wss = new WebSocketServer({ host: '0.0.0.0', port: this.port || 8082 })
    this.wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        const RPCMsg = JSONRPCRequestSchema.parse(JSON.parse(String(message)))

        this.onmessage(RPCMsg, ws)
      })
    })
  }

  send(clientId: string, message: JSONRPCResponse): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = this.getClient(clientId)
      if (ws) {
        ws.send(JSON.stringify(message))
        resolve()
      } else {
        reject('Invalid WebSocket')
      }
    })
  }

  close(clientId: string) {
    const ws = this.getClient(clientId)
    ws?.close()
  }

  onmessage(message: JSONRPCRequest, ws: WebSocket) {
    console.log('Server receive msg: ', message)
    if (message.method === 'initialize') {
      const clientId = genClientId()
      const resp: JSONRPCResponse = {
        jsonrpc: '2.0',
        id: clientId,
        result: {
          clientId,
          method: 'initialize',
        },
      }

      this.clientMap.set(clientId, ws)
      this.send(clientId, resp)
    }
  }
}
