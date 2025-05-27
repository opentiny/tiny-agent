import { program } from 'commander'
import path from 'node:path'
import { TinyAgentMcpServer } from './mcp/server'
import { SocketServer } from './socket/server'

program
  .name('@opentiny/tiny-agent-mcp-tool-server')
  .description('tiny-agent-mcp-tool-server')
  .version('1.0.0')
  .requiredOption('-f --file <path>', '指定文件路径')
  .option('-p --port <port>', '指定启动端口')
  .parse(process.argv)

const init = async () => {
  const { file, port } = program.opts()

  try {
    const socketServer = new SocketServer(port)
    const mcpServer = new TinyAgentMcpServer(socketServer)
    const __dirname = __filename.replace('main.ts', '')
    const filePath = file.startsWith('.')
      ? path.resolve(__dirname, '..', file)
      : path.resolve(file)

    socketServer.start()
    mcpServer.start(filePath)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

init()
