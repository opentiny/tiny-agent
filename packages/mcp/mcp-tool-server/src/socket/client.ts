import { McpService } from '@opentiny/tiny-agent-mcp-service'
import { Client } from './type'

interface SocketMessage {
  type: string
  data: any
}

class WebSocketClient implements Client {
  private socket!: WebSocket | null
  private url: string
  private messageHandlerMap: Map<string, (data: any) => void>

  clientId: string | undefined

  constructor(url: string) {
    this.url = url
    this.messageHandlerMap = new Map()
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.url)

      this.socket.onopen = () => {
        console.log('WebSocket connected')
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
          console.log('Message parsing error:', error)
        }
      }

      this.socket.onerror = (error: Event) => {
        console.error('WebSocket Error：', error)
      }

      this.socket.onclose = () => {
        console.log('WebSocket Closed')
      }
    })
  }

  sendMessage(type: string, data: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data, id: this.clientId || '' }))
    } else {
      console.error('WebSocket not connected')
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
  onTask: (arg: any) => any,
  mcpService: McpService,
  url: string
) {
  const wsUrl = url || 'ws://localhost:8082'
  client = new WebSocketClient(wsUrl)

  client.connect().then(() => {
    // 发送消息
    client.sendMessage('connection', { text: 'Hello, Socket Server!' })

    client.onMessage('connection', (message) => {
      if (message?.clientId) {
        client.clientId = message.clientId
        console.log('established:', client.clientId)
      }
    })

    client.onMessage('doTask', (message) => {
      const { name, task, args } = message.data

      const doTask = () => {
        if (task) {
          return onTask(task)
        } else {
          return mcpService.getContext().tools[name](args)
        }
      }

      doTask()
        .then(() => {
          client.sendMessage('taskSuccess', {
            text: 'execute task success!',
          })
        })
        .catch((err: Error) => {
          client.sendMessage('taskFail', { text: err })
        })
    })

    client.onMessage('queryTools', () => {
      client.sendMessage('mcpTool', {
        text: JSON.stringify(
          mcpService.getAllTools().map(McpService.toolToJson)
        ),
      })
    })

    // 接收消息
    client.onMessage('chat', (message) => {
      console.log('chat:', message)
    })

    // 心跳检测
    setInterval(() => {
      client.sendMessage('ping', {})
    }, 3000)
  })

  return client
}
