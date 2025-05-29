# McpToolParser

用于将 JSON 格式的静态工具填充参数转换为符合 MCP 协议标准的 MCP Tool

## 用法

```typescript
const doTask = () => {
  console.log('execute task...')
}
const mcpToolParser = new McpToolParser(doTask)

// mcpToolJson 为JSON格式的静态工具集 详细可参考demo目录下的mcp-tool.json
// 得到的mcpTools即为符合MCP协议标准的MCP Tool集合
const mcpTools = mcpToolParser.extractAllTools(mcpToolJson)
```
