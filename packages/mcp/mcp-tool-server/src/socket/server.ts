import { WebSocket, WebSocketServer } from 'ws'
import { genClientId } from '../utils/genClientId'

export enum MessageType {
  Connection = 'connection',
  DoTask = 'doTask',
  TaskSuccess = 'taskSuccess',
  TaskFail = 'taskFail',
  Chat = 'chat',
  Ping = 'ping',
  McpTool = 'mcpTool',
}

export default class SocketServer {
  private wss: WebSocketServer

  private clientMap: Map<string, WebSocket>

  constructor(port: number) {
    this.wss = new WebSocketServer({ host: '0.0.0.0', port: port || 8082 })
    this.clientMap = new Map()
  }

  private handleClientMessage(ws: WebSocket, message: string) {
    try {
      const parsedMessgae = JSON.parse(String(message))
      let responseMessage: any = null

      if (parsedMessgae.type === MessageType.Connection) {
        const clientId = genClientId()

        this.clientMap.set(clientId, ws)
        responseMessage = {
          type: MessageType.Connection,
          clientId,
        }
      } else {
        const clientId = parsedMessgae.id

        if (!parsedMessgae.id || !this.clientMap.get(clientId)) {
          throw new Error(`invalid client: ${JSON.stringify(parsedMessgae)}`)
        } else {
          console.log(`from ${clientId}: `, parsedMessgae)

          responseMessage = 'Hello! Message from server...'
        }
      }

      ws.send(JSON.stringify(responseMessage))
    } catch (e) {
      console.error('error log: ', e)
    }
  }

  start() {
    this.wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        this.handleClientMessage(ws, String(message))
      })
    })
  }

  sendMsg(clientId: string, message: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = this.clientMap.get(clientId)

      if (ws) {
        ws.send(message)
        resolve(ws)
      } else {
        reject('invalid websocket')
      }
    })
  }

  sendAndWaitTaskMsg(
    clientId: string,
    message: string,
    responseMessageTypes?: MessageType[]
  ) {
    return new Promise((resolve, reject) => {
      this.sendMsg(clientId, message)
        .then((ws: WebSocket) => {
          ws.on('message', (message) => {
            try {
              const parsedMessgae = JSON.parse(String(message))
              const messageTypes = [
                MessageType.TaskSuccess,
                MessageType.TaskFail,
              ]

              if (
                (responseMessageTypes || messageTypes).includes(
                  parsedMessgae.type
                )
              ) {
                resolve(parsedMessgae)
              }
            } catch (e) {
              reject(e)
            }
          })
        })
        .catch(() => {
          reject('invalid client')
        })
    })
  }
}
