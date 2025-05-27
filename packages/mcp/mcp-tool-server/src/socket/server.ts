import { WebSocket, WebSocketServer } from 'ws'
import { genClientId } from '../utils/genClientId'
import { MessageType, Server } from './type'

export class SocketServer implements Server {
  private wss: WebSocketServer

  private clientMap: Map<string, WebSocket>

  constructor(port: number) {
    this.wss = new WebSocketServer({ host: '0.0.0.0', port: port || 8082 })
    this.clientMap = new Map()
  }

  private handleClientMessage(ws: WebSocket, message: string) {
    try {
      const parsedMessage = JSON.parse(String(message))
      let responseMessage: any = null

      if (parsedMessage.type === MessageType.Connection) {
        const clientId = genClientId()

        this.clientMap.set(clientId, ws)
        responseMessage = {
          type: MessageType.Connection,
          clientId,
        }
      } else {
        const clientId = parsedMessage.id

        if (!parsedMessage.id || !this.clientMap.get(clientId)) {
          throw new Error(`invalid client: ${JSON.stringify(parsedMessage)}`)
        } else {
          console.log(`from ${clientId}: `, parsedMessage)

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

  sendMessage(clientId: string, message: string): Promise<WebSocket> {
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

  sendAndListen(
    clientId: string,
    message: string,
    responseMessageTypes?: MessageType[]
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sendMessage(clientId, message)
        .then((ws: WebSocket) => {
          ws.on('message', (message) => {
            try {
              const parsedMessage = JSON.parse(String(message))
              const messageTypes = [
                MessageType.TaskSuccess,
                MessageType.TaskFail,
              ]

              if (
                (responseMessageTypes || messageTypes).includes(
                  parsedMessage.type
                )
              ) {
                resolve(parsedMessage)
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
