import express, { Express, Request, Response } from 'express';
import fs from 'fs/promises';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import SocketServer, { MessageType } from '../socket/server';
import { McpTool, McpToolTaskSchema } from './type';

export default class TinyAgentMcpServer {
  private socketServer: SocketServer;
  private transports: any;
  private sessionConntionMap: Map<string, string>;
  private app: Express;
  private serverMap: Map<string, Server>;
  private mcpToolFilePath: string;
  private tools: McpTool[];

  constructor(socketServer: SocketServer) {
    this.socketServer = socketServer;
    this.transports = {};
    this.sessionConntionMap = new Map();
    this.serverMap = new Map();
    this.tools = [];
    this.app = express();
  }

  private replacePlaceholder(
    task: McpToolTaskSchema,
    inputSchema: any,
    actualParams: Record<string, unknown>
  ) {
    let schemaStr = JSON.stringify(task);
    let taskSchema;

    Object.keys(inputSchema)?.forEach((param) => {
      schemaStr = schemaStr
        .split(`{{${param}}}`)
        .join(actualParams[param].toString());
    });

    try {
      taskSchema = JSON.parse(schemaStr);
    } catch {
      taskSchema = task;
    }

    return taskSchema;
  }

  private async handleStaticMcpTools(file: string) {
    try {
      try {
        await fs.access(file);
      } catch {
        throw new Error(`文件不存在： ${file}`);
      }

      if (!file.toLocaleLowerCase().endsWith('.json')) {
        console.warn('警告：文件扩展名不是 .json');
      }

      const fileContent = await fs.readFile(file, 'utf-8');
      const tools = JSON.parse(fileContent);

      return tools;
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('error: 文件内容不是有效的JSON格式');
      } else {
        console.error(error);
      }
    }

    return [];
  }

  private async mergeMcpTools(sessionId: string) {
    // 从websocket client查找tools
    const clientId = this.sessionConntionMap.get(sessionId);
    let tools = [];

    if (clientId) {
      const message = JSON.stringify({
        type: 'queryTools',
        message: 'query mcp tool',
      });

      try {
        const res: any = await this.socketServer.sendAndWaitTaskMsg(
          clientId,
          message,
          [MessageType.McpTool]
        );

        if (res?.data?.length) {
          tools = JSON.parse(res.data);
        }
      } catch (e) {
        tools = [];
        console.error(`send msg error: ${e}`);
      }
    }

    // 静态mcp tool
    const staticTools = await this.handleStaticMcpTools(this.mcpToolFilePath);

    return [...tools, ...staticTools];
  }

  private setupRequestHandler(server: Server, sessionId: string) {
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.tools = await this.mergeMcpTools(sessionId);

      return {
        tools: this.tools.map((tool) => ({
          ...tool,
          inputSchema: {
            type: 'object',
            properties: tool.inputSchema,
          },
        })),
      };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const targetTool = this.tools.find((tool) => name === tool.name);
      const clientId = this.sessionConntionMap.get(sessionId);

      if (targetTool?.task) {
        targetTool.task = this.replacePlaceholder(
          targetTool.task,
          targetTool.inputSchema,
          args
        );
      } else {
        targetTool.args = args;
      }

      const message = {
        type: MessageType.DoTask,
        data: targetTool,
      };

      const res = await this.socketServer.sendAndWaitTaskMsg(
        clientId,
        JSON.stringify(message)
      );

      return {
        content: [
          {
            type: 'text',
            text: res,
          },
        ],
      };
    });
  }

  private initServer(sessionId) {
    let server = this.serverMap.get(sessionId);

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
      );
    }

    this.setupRequestHandler(server, sessionId);

    return server;
  }

  start(file: string) {
    this.mcpToolFilePath = file;

    this.app.post('/mcp', async (req, res) => {
      const { client } = req.query;
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && this.transports.streamable[sessionId]) {
        transport = this.transports.streamable[sessionId];
      } else {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId) => {
            this.transports.streamable[sessionId] = transport;
          },
          enableJsonResponse: true,
        });

        this.sessionConntionMap.set(transport.sessionId, String(client));

        transport.onclose = () => {
          if (transport.sessionId) {
            delete this.transports.streamable[transport.sessionId];
          }
        };

        const server = this.initServer(transport.sessionId);

        await server.connect(transport);
      }

      await transport.handleRequest(req, res, req.body);
    });

    const handleSessionRequest = async (
      req: express.Request,
      res: express.Response
    ) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (!sessionId || !this.transports.streamable[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
      }

      const transport = this.transports.streamable[sessionId];
      await transport.handleRequest(req, res);
    };

    this.app.get('/mcp', handleSessionRequest);

    this.app.delete('/mcp', handleSessionRequest);

    this.app.get('/sse', async (req: Request, res: Response) => {
      const { client } = req.query;
      const transport = new SSEServerTransport('/messages', res);

      this.transports[transport.sessionId] = transport;
      this.sessionConntionMap.set(transport.sessionId, String(client));

      res.on('close', () => {
        delete this.transports[transport.sessionId];
      });

      const server = this.initServer(transport.sessionId);

      await server.connect(transport);
    });

    this.app.post('/messages', async (req: Request, res: Response) => {
      const sessionId = req.query.sessionId as string;

      if (sessionId) {
        const transport = this.transports[sessionId];
        if (transport) {
          await transport.handlePostMessage(req, res);
        } else {
          res.status(400).send('No transport found for sessionId');
        }
      }
    });

    this.app.listen(3005, '0.0.0.0');
  }
}
