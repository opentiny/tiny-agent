

# McpService

提供应用端端 MCP 服务，支持使用 MCPServer 注册工具等，通过覆写 MCPServer 部分发那个发支持了验证功能和先连接`Transport`后注册工具动态注册功能。


- **用法**

```typescript
const mcp = new McpService();
const mcpServer = mcp.mcpServer;
mcpServer.connect(...);
mcpServer.tool(...);
```

- **属性**


- **方法**






