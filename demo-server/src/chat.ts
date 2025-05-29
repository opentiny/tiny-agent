import { createMCPClientChat} from '@opentiny/tiny-agent-mcp-client-chat';
import type { MCPClientOptions } from '@opentiny/tiny-agent-mcp-client-chat';
import type { Request, Response } from 'express';
import getRawBody from 'raw-body';

export function createChat(configFn: (req: Request) => MCPClientOptions) {
  const chatHandler = async (req: Request, res: Response) => {
    const mcpClientChat = await createMCPClientChat(configFn(req));

    const body = JSON.parse(
      await getRawBody(req, { encoding: 'utf-8' })
    )
    try {
      // 流式数据返回
      const streamResponse = await mcpClientChat.chat(body.query || body.messages);

      streamResponse.pipe(res);
    } catch (error) {
      // 错误处理
      console.log(error);
    }
  }
  return {
    chatHandler
  }
}
