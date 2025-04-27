interface SocketMessage {
  type: string
  data: any
}

class WebSocketClient {
  private socket: WebSocket | null

  private url: string

  private messageHandlerMap: Map<string, (data: any) => void>

  clientId: string

  constructor(url: string) {
    this.url = url
    this.messageHandlerMap = new Map()
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.url)

      this.socket.onopen = () => {
        console.log('WebSocket 连接已建立')
        resolve()
      }

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          let message: SocketMessage

          if (typeof event.data === 'string') {
            message = {
              type: 'chat',
              data: event.data,
            }
          } else {
            message = JSON.parse(event.data)
          }

          const handler = this.messageHandlerMap.get(message.type)

          if (handler) {
            handler(message.data)
          }
        } catch (error) {
          console.log('消息解析错误：', error)
        }
      }

      this.socket.onerror = (error: Event) => {
        console.error('WebSocket 错误：', error)
      }

      this.socket.onclose = () => {
        console.log('WebSocket 连接已关闭')
      }
    })
  }

  sendMessage(type: string, data: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data, id: this.clientId || '' }))
    } else {
      console.error('WebSocket 未连接')
    }
  }

  onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlerMap.set(type, handler)
  }

  disconnect(): void {
    this.socket?.close()
  }
}

let client: WebSocketClient

export function startClient(taskScheduler, port) {
  client = new WebSocketClient(`ws://localhost:${port}`)

  client.connect().then(() => {
    // 发送消息
    client.sendMessage('connection', { text: 'Hello, Socket Server!' })

    // 接收消息
    client.onMessage('chat', (data) => {
      let message: any

      try {
        message = JSON.parse(data)
      } catch {
        message = null
      }

      if (message?.clientId) {
        client.clientId = message.clientId
        console.log('建立握手：', client.clientId)
      } else {
        if (typeof message === 'object') {
          taskScheduler
            .doTask(message)
            .then(() => {
              client.sendMessage('taskSuccess', {
                text: 'execute task success!',
              })
            })
            .catch(() => {
              client.sendMessage('taskFail', { text: 'execute task fail!' })
            })
        }

        console.log('收到消息:', data)
      }
    })

    // 心跳检测
    setInterval(() => {
      client.sendMessage('ping', {})
    }, 3000)
  })

  return client
}
