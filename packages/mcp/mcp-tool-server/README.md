运行 **pnpm mock:mcp** 会使用 mock 的 mcp-tool 数据进行调试

WebSocket 消息格式

```json
{
  "type": "chat", // "chat" | "ping" | "connention" | "mcpTool" | "taskSuccess" | "taskFail",
  "data": {},
  "clientId": "" // not required
}
```
