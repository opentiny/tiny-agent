import express, { Express, Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import fs from 'fs/promises'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { McpTool, McpToolTaskSchema } from './type'
import { MessageType, Server as SocketServer } from '../socket/type'

export default class TinyAgentMcpServer {
  private socketServer: SocketServer
  private transports: any
  private sessionConntionMap: Map<string, string>
  private app: Express
  private serverMap: Map<string, Server>
  private mcpToolFilePath!: string
  private tools: McpTool[]

  constructor(socketServer: SocketServer) {
    this.socketServer = socketServer
    this.transports = {
      streamable: {} as Record<string, StreamableHTTPServerTransport>,
      sse: {} as Record<string, SSEServerTransport>,
    }
    this.sessionConntionMap = new Map()
    this.serverMap = new Map()
    this.tools = []
    this.app = express()
  }

  private replacePlaceholder(
    task: McpToolTaskSchema,
    inputSchema: any,
    actualParams: Record<string, unknown> | undefined
  ) {
    let schemaStr = JSON.stringify(task)
    let taskSchema

    if (actualParams) {
      Object.keys(inputSchema)?.forEach((param) => {
        schemaStr = schemaStr
          .split(`{{${param}}}`)
          .join(actualParams[param]?.toString())
      })
    }

    try {
      taskSchema = JSON.parse(schemaStr)
    } catch {
      taskSchema = task
    }

    return taskSchema
  }

  private async handleStaticMcpTools(file: string) {
    try {
      try {
        await fs.access(file)
      } catch {
        throw new Error(`File Not Exist: ${file}`)
      }

      if (!file.toLocaleLowerCase().endsWith('.json')) {
        console.warn('Warning: The file extension is not. json')
      }

      const fileContent = await fs.readFile(file, 'utf-8')
      const tools = JSON.parse(fileContent)

      return tools
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('Error: The file content is not in a valid JSON format')
      } else {
        console.error(error)
      }
    }

    return []
  }

  private async mergeMcpTools(sessionId: string) {
    // 从websocket client查找tools
    const clientId = this.sessionConntionMap.get(sessionId)
    let tools = []

    if (clientId) {
      const message = JSON.stringify({
        type: MessageType.QueryTools,
        message: 'query mcp tools',
      })

      try {
        const res: any = await this.socketServer.sendAndListen(
          clientId,
          message,
          [MessageType.McpTool]
        )

        if (res.data?.text?.length) {
          tools = res.data.text
        }
      } catch (e) {
        tools = []
        console.error(`Send Msg Error: ${e}`)
      }
    }

    // 静态mcp tool
    const staticTools = await this.handleStaticMcpTools(this.mcpToolFilePath)

    return [...tools, ...staticTools]
  }

  private setupRequestHandler(server: Server, sessionId: string) {
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.tools = await this.mergeMcpTools(sessionId)

      return {
        tools: this.tools.map((tool) => ({
          ...tool,
          inputSchema: {
            type: 'object',
            properties: tool.inputSchema,
          },
        })),
      }
    })

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params
      const targetTool = this.tools.find((tool) => name === tool.name)
      const clientId = this.sessionConntionMap.get(sessionId)
      let response

      if (targetTool) {
        if (targetTool?.task) {
          targetTool.task = this.replacePlaceholder(
            targetTool.task,
            targetTool.inputSchema,
            args
          )
        } else {
          targetTool.args = args
        }

        const message = {
          type: MessageType.DoTask,
          data: targetTool,
        }

        if (clientId) {
          response = await this.socketServer.sendAndListen(
            clientId,
            JSON.stringify(message)
          )
        }
      } else {
        response = 'invalid tool'
      }

      return {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
      }
    })
  }

  private initServer(sessionId: string) {
    let server = this.serverMap.get(sessionId)

    if (!server) {
      server = new Server(
        {
          name: 'tiny-agent-mcp-server' + sessionId,
          version: '1.0.0',
        },
        {
          capabilities: {
            tools: {},
          },
        }
      )
    }

    this.setupRequestHandler(server, sessionId)

    return server
  }

  start(file: string) {
    this.mcpToolFilePath = file

    this.app.post('/mcp', async (req, res) => {
      const { client } = req.query
      const sessionId = req.headers['mcp-session-id'] as string | undefined
      let transport: StreamableHTTPServerTransport

      if (sessionId && this.transports.streamable[sessionId]) {
        transport = this.transports.streamable[sessionId]
      } else {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId) => {
            this.transports.streamable[sessionId] = transport
          },
          enableJsonResponse: true,
        })

        const sessionId = transport.sessionId || ''

        this.sessionConntionMap.set(sessionId, String(client))

        transport.onclose = () => {
          if (sessionId) {
            delete this.transports.streamable[sessionId]
          }
        }

        const server = this.initServer(sessionId)

        await server.connect(transport)
      }

      await transport.handleRequest(req, res, req.body)
    })

    const handleSessionRequest = async (
      req: express.Request,
      res: express.Response
    ) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined
      if (!sessionId || !this.transports.streamable[sessionId]) {
        res.status(400).send('Invalid or missing session ID')
        return
      }

      const transport = this.transports.streamable[sessionId]
      await transport.handleRequest(req, res)
    }

    this.app.get('/mcp', handleSessionRequest)

    this.app.delete('/mcp', handleSessionRequest)

    this.app.get('/sse', async (req: Request, res: Response) => {
      const { client } = req.query
      const transport = new SSEServerTransport('/messages', res)

      this.transports.sse[transport.sessionId] = transport
      this.sessionConntionMap.set(transport.sessionId, String(client))

      res.on('close', () => {
        delete this.transports.sse[transport.sessionId]
      })

      const server = this.initServer(transport.sessionId)

      await server.connect(transport)
    })

    this.app.post('/messages', async (req: Request, res: Response) => {
      const sessionId = req.query.sessionId as string

      if (sessionId) {
        const transport = this.transports.sse[sessionId]
        if (transport) {
          await transport.handlePostMessage(req, res)
        } else {
          res.status(400).send('No transport found for sessionId')
        }
      }
    })

    this.app.listen(3001, '0.0.0.0')
  }
}
