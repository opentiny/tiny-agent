enum MessageType {
  Connection = 'connection',
  DoTask = 'doTask',
  TaskSuccess = 'taskSuccess',
  TaskFail = 'taskFail',
  Chat = 'chat',
  Ping = 'ping',
  McpTool = 'mcpTool',
  QueryTools = 'queryTools',
}

type ClientMessgae = {
  id: string // client id
  type: MessageType // message type
  data: {
    text: string
  }
}

type ServerMessage = {
  type: MessageType
  message: string
}

interface Client {
  connect(): Promise<void>

  disconnect(): void

  sendMessage(type: string, data: ClientMessgae): void

  onMessage?: (type: string, handler: () => {}) => void

  clientId?: string
}

interface Server {
  start(): void

  sendMessage(clientId: string, message: string): Promise<any>

  sendAndListen(
    clientId: string,
    message: string,
    responseMessageTypes?: MessageType[]
  ): Promise<ServerMessage | Error>

  onMessage?: (message: string) => void
}

export { Client, Server, MessageType }
