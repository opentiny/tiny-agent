import { WebSocket, WebSocketServer } from 'ws'
import { genClientId } from '../utils/genClientId'

export default class SocketServer {
  private wss: WebSocketServer
  private clientMap: Map<string, WebSocket>

  constructor(port: number) {
    this.wss = new WebSocketServer({ port: port || 8082 })
    this.clientMap = new Map()
  }

  private handleClientMessage(ws: WebSocket, messages: string) {
    try {
      const parsedMessgae = JSON.parse(String(messages))
      let responseMessage: any = null

      if (parsedMessgae.type === 'connection') {
        const clientId = genClientId()

        this.clientMap.set(clientId, ws)
        responseMessage = {
          clientId
        }
      } else {
        const clientId = parsedMessgae.id

        if (!parsedMessgae.id || !this.clientMap.get(clientId)) {
          throw new Error(`未知客户端：${JSON.stringify(parsedMessgae)}`)
        } else {
          console.log(`${clientId}的消息：`, parsedMessgae)

          responseMessage = 'Hello! Message from server...'
        }
      }

      ws.send(JSON.stringify(responseMessage))
    } catch(e) {
      console.log('error log: ' , e)
    }
  }

  start() {
    this.wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        this.handleClientMessage(ws, String(message))
      })
    })
  }

  sendMsg(clientId: string, message: string) {
     const ws = this.clientMap.get(clientId)

     if (ws) {
      ws.send(message)
     }
  }
}