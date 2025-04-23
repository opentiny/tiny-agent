import express, { Express, Request, Response } from 'express'
import fs from 'fs/promises'
import { z, ZodRawShape } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import SocketServer from '../socket/server'
import { McpToolParam, McpToolTaskSchema } from '.'

export default class TinyAgentMcpServer {
  private server: McpServer
  private socketServer: SocketServer
  private transports: any
  private sessionConntionMap: Map<string, string>
  private app: Express

  constructor(socketServer: SocketServer) {
    this.socketServer = socketServer
    this.transports = {}
    this.sessionConntionMap = new Map()
    this.app = express()

    this.server = new McpServer({
      name: 'tiny-agent-mcp-server',
      version: '1.0.0',
    })
  }

  private replacePlaceholder(
    task: McpToolTaskSchema,
    funcParams: McpToolParam[],
    actualParams: any
  ) {
    let scheamStr = JSON.stringify(task)

    funcParams?.forEach(({ type, name }) => {
      scheamStr = scheamStr.split(`{{${name}}}`).join(actualParams[name])
    })

    return scheamStr
  }

  async registerMcpTools(file: string) {
    try {
      try {
        await fs.access(file)
      } catch {
        throw new Error(`文件不存在： ${file}`)
      }

      if (!file.toLocaleLowerCase().endsWith('.json')) {
        console.warn('警告：文件扩展名不是 .json')
      }

      const fileContent = await fs.readFile(file, 'utf-8')
      const fileJson = JSON.parse(fileContent)

      Object.keys(fileJson).forEach((key) => {
        const { name, description, inputSchema, task } = fileJson[key]
        const toolParams: ZodRawShape = {}

        if (inputSchema?.length) {
          ;(inputSchema as McpToolParam[]).forEach(({ type, name }) => {
            toolParams[name] = (z as any)[type]()
          })
        }

        this.server.tool(
          name,
          description,
          toolParams,
          async (_, { sessionId = '' }) => {
            const tabId = this.sessionConntionMap.get(sessionId)

            if (tabId) {
              try {
                const res = await this.socketServer.sendAndWaitTaskMsg(
                  tabId,
                  this.replacePlaceholder(task, inputSchema, _)
                )

                console.log('tash execute res:', res)
              } catch (e) {
                console.log('send msg error:', e)
              }
            }

            return {
              content: [{ type: 'text', text: `tools: ${tabId}` }],
            }
          }
        )
      })
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('error: 文件内容不是有效的JSON格式')
      } else {
        console.error(error)
      }
    }
  }

  start(file: string) {
    this.registerMcpTools(file)

    this.app.get('/sse', async (req: Request, res: Response) => {
      const { client } = req.query
      const transport = new SSEServerTransport('/messages', res)

      this.transports[transport.sessionId] = transport
      this.sessionConntionMap.set(transport.sessionId, String(client))

      res.on('close', () => {
        delete this.transports[transport.sessionId]
      })

      await this.server.connect(transport)
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
