import { WebSocket, WebSocketServer } from 'ws'
import { genClientId } from '../utils/genClientId'

enum MessageType {
  Connection = 'connection',
  TaskSuccess = 'taskSuccess',
  TaskFail = 'taskFail',
  Chat = 'chat',
  Ping = 'ping',
  RegisterTool = 'registerTool',
}

export default class SocketServer {
  private wss: WebSocketServer

  private clientMap: Map<string, WebSocket>

  constructor(port: number) {
    this.wss = new WebSocketServer({ port: port || 8082 })
    this.clientMap = new Map()
  }

  private handleClientMessage(
    ws: WebSocket,
    message: string,
    callback = (data) => {}
  ) {
    try {
      const parsedMessgae = JSON.parse(String(message))
      let responseMessage: any = null

      switch (parsedMessgae.type) {
        case MessageType.Connection: {
          const clientId = genClientId()

          this.clientMap.set(clientId, ws)
          responseMessage = {
            clientId,
          }
        }
        case MessageType.RegisterTool: {
          callback(parsedMessgae.data)
        }
        default: {
          const clientId = parsedMessgae.id

          if (!parsedMessgae.id || !this.clientMap.get(clientId)) {
            throw new Error(`未知客户端：${JSON.stringify(parsedMessgae)}`)
          } else {
            console.log(`${clientId}的消息：`, parsedMessgae)

            responseMessage = 'Hello! Message from server...'
          }
        }
      }

      ws.send(JSON.stringify(responseMessage))
    } catch (e) {
      console.log('error log: ', e)
    }
  }

  start() {
    this.wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        this.handleClientMessage(ws, String(message))
      })
    })
  }

  onRegisterMessage(callback) {
    this.wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        this.handleClientMessage(ws, String(message), callback)
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
        reject()
      }
    })
  }

  sendAndWaitTaskMsg(clientId: string, message: string) {
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

              if (messageTypes.includes(parsedMessgae.type)) {
                resolve(parsedMessgae)
              }
            } catch (e) {
              reject(e)
            }
          })
        })
        .catch(() => {
          reject('invail client')
        })
    })
  }
}
