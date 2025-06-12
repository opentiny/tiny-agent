# McpToolParser

用于将 JSON 格式的静态工具填充参数转换为符合 MCP 协议标准的 MCP Tool

## 方法

### replaceInstructionParamValue

使用真实参数替换静态工具 JSON 数据中的参数占位符

#### 示例

```typescript
const doTask = () => {
  console.log('execute task...');
};
const mcpToolParser = new McpToolParser(doTask);
const instruction: InstructionSchema = {
  action: '注册Tool',
  params: {
    name: '{{name}}',
  },
};

mcpToolParser.replaceInstructionParamValue(instruction, 'name', 'queryTool');

console.log(instruction); // { action: '注册Tool', params: { name: 'queryTool' } }
```

## extractTool & extractAllTools

将 JSON 格式的静态工具填充参数转换为符合 MCP 协议标准

#### 示例

```typescript
const doTask = () => {
  console.log('execute task...');
};
const mcpToolParser = new McpToolParser(doTask);

/**
 * extractTool 将单个工具进行标准化
 * extractAllTools 批量将多个工具进行标准化
 * mcpToolJson 为JSON格式的静态工具集 详细可参考demo目录下的mcp-tool.json
 * mcpTool 即为符合MCP协议标准的MCP Tool
 **/
const mcpTool = mcpToolParser.extractTool(mcpToolJson);
const mcpTools = mcpToolParser.extractAllTools(mcpToolsJson);
```

## getTaskOutputSchema

获取 MCP Tool OutputSchema

#### 示例

```typescript
const doTask = () => {
  console.log('execute task...');
};
const mcpToolParser = new McpToolParser(doTask);
const taskOutputSchema = mcpToolParser.getTaskOutputSchema();
```
