import { McpService } from '@opentiny/tiny-agent-mcp-service'

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
          const data = JSON.parse(event.data)

          if (typeof data === 'string') {
            message = {
              type: 'chat',
              data: event.data,
            }
          } else {
            message = data
          }

          const handler = this.messageHandlerMap.get(message.type)

          if (handler) {
            handler(message)
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

export function startClient(
  taskScheduler,
  mcpService: McpService,
  port: string
) {
  client = new WebSocketClient(`ws://localhost:${port}`)

  client.connect().then(() => {
    // 发送消息
    client.sendMessage('connection', { text: 'Hello, Socket Server!' })

    client.onMessage('connection', (message) => {
      if (message?.clientId) {
        client.clientId = message.clientId
        console.log('建立握手：', client.clientId)
      }
    })

    client.onMessage('doTask', (message) => {
      const { name, task } = message.data

      const doTask = () => {
        if (task) {
          return taskScheduler.doTask(task)
        } else {
          return mcpService.getContext().tools[name]()
        }
      }

      doTask()
        .then(() => {
          client.sendMessage('taskSuccess', {
            text: 'execute task success!',
          })
        })
        .catch(() => {
          client.sendMessage('taskFail', { text: 'execute task fail!' })
        })
    })

    client.onMessage('queryTools', () => {
      client.sendMessage(
        'mcpTool',
        JSON.stringify(mcpService.getAllTools().map(McpService.toolToJson))
      )
    })

    // 接收消息
    client.onMessage('chat', (message) => {
      console.log('收到消息:', message)
    })

    // 心跳检测
    setInterval(() => {
      client.sendMessage('ping', {})
    }, 3000)
  })

  return client
}
