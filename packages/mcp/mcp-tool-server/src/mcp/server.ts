import express, { Express, Request, Response } from 'express'
import fs from 'fs/promises'
import { z, ZodRawShape } from 'zod'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import SocketServer, { MessageType } from '../socket/server'
import { McpToolParam, McpToolTaskSchema } from '.'

export default class TinyAgentMcpServer {
  private socketServer: SocketServer
  private transports: any
  private sessionConntionMap: Map<string, string>
  private app: Express
  private tools: Tool[]
  private serverMap: Map<string, Server>

  constructor(socketServer: SocketServer) {
    this.socketServer = socketServer
    this.transports = {}
    this.sessionConntionMap = new Map()
    this.serverMap = new Map()
    this.tools = []
    this.app = express()
  }

  // private replacePlaceholder(
  //   task: McpToolTaskSchema,
  //   funcParams: McpToolParam[],
  //   actualParams: any
  // ) {
  //   let scheamStr = JSON.stringify(task)

  //   funcParams?.forEach(({ type, name }) => {
  //     scheamStr = scheamStr.split(`{{${name}}}`).join(actualParams[name])
  //   })

  //   return JSON.parse(scheamStr)
  // }

  // async registerMcpTools(resource) {
  //   Object.keys(resource).forEach((key) => {
  //     const { name, description, inputSchema, task, type } = resource[key]
  //     const toolParams: ZodRawShape = {}

  //     if (inputSchema?.length) {
  //       ;(inputSchema as McpToolParam[]).forEach(({ type, name }) => {
  //         toolParams[name] = (z as any)[type]()
  //       })
  //     }

  //     this.server.tool(
  //       name,
  //       description,
  //       toolParams,
  //       async (actualParams, { sessionId = '' }) => {
  //         const clientId = this.sessionConntionMap.get(sessionId)

  //         if (clientId) {
  //           try {
  //             let message: any = null

  //             if (type === 'ui') {
  //               message = {
  //                 type,
  //                 content: this.replacePlaceholder(
  //                   task,
  //                   inputSchema,
  //                   actualParams
  //                 ),
  //               }
  //             } else {
  //               message = { type, content: { func: key, args: actualParams } }
  //             }

  //             this.socketServer
  //               .sendAndWaitTaskMsg(clientId, JSON.stringify(message))
  //               .then((res) => {
  //                 console.log('tash execute res:', res)
  //               })
  //           } catch (e) {
  //             console.log('send msg error:', e)
  //           }
  //         }

  //         return {
  //           content: [{ type: 'text', text: `tools: ${clientId}` }],
  //         }
  //       }
  //     )
  //   })
  // }

  // async registerUIMcpTools(file: string) {
  //   try {
  //     try {
  //       await fs.access(file)
  //     } catch {
  //       throw new Error(`文件不存在： ${file}`)
  //     }

  //     if (!file.toLocaleLowerCase().endsWith('.json')) {
  //       console.warn('警告：文件扩展名不是 .json')
  //     }

  //     const fileContent = await fs.readFile(file, 'utf-8')
  //     const fileJson = JSON.parse(fileContent)

  //     this.registerMcpTools(fileJson)
  //   } catch (error) {
  //     if (error instanceof SyntaxError) {
  //       console.error('error: 文件内容不是有效的JSON格式')
  //     } else {
  //       console.error(error)
  //     }
  //   }
  // }

  // registerOperationMcpTools() {
  //   this.socketServer.onRegisterMessage((toolData) => {
  //     this.registerMcpTools(toolData)
  //   })
  // }
  async mergeMcpTools(sessionId: string) {
    // 从websocket client查找tools
    const clientId = this.sessionConntionMap.get(sessionId)
    let tools = []

    if (clientId) {
      const message = JSON.stringify({
        type: 'quertTools',
        message: 'query mcp tool',
      })
      const res: any = await this.socketServer.sendAndWaitTaskMsg(
        clientId,
        message,
        [MessageType.McpTool]
      )

      if (res?.data?.length) {
        tools = res.data
      }
    }

    return tools
  }

  private setupRequestHandler(server: Server, sessionId: string) {
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = await this.mergeMcpTools(sessionId)

      return {
        tools: tools || [
          {
            name: 'addUser',
            description: '添加员工',
            inputSchema: {
              type: 'object',
              properties: {
                a: {
                  type: 'string',
                  description: '姓名',
                },
              },
            },
          },
        ],
      }
    })

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params
      return {
        content: [
          {
            type: 'text',
            text: `tool is ${name}`,
          },
        ],
      }
    })
  }

  private initServer(sessionId) {
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
    // this.registerUIMcpTools(file)
    // this.registerOperationMcpTools()

    this.app.get('/sse', async (req: Request, res: Response) => {
      const { client } = req.query
      const transport = new SSEServerTransport('/messages', res)

      this.transports[transport.sessionId] = transport
      this.sessionConntionMap.set(transport.sessionId, String(client))

      res.on('close', () => {
        delete this.transports[transport.sessionId]
      })

      const server = this.initServer(transport.sessionId)

      await server.connect(transport)
    })

    this.app.post('/messages', async (req: Request, res: Response) => {
      const sessionId = req.query.sessionId as string

      if (sessionId) {
        const transport = this.transports[sessionId]
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
