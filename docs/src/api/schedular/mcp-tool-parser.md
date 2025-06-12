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

## AI操作说明书

### API说明

```typescript
type McpToolsSchema = {
  tools: Array<McpToolSchema>; // 工具集
};

// 在 MCP 标准Tool协议的基础上进行拓展
type McpToolSchema = {
  name: string; // 工具名称
  task: McpToolTaskSchema; // 任务调度器--任务描述
} & Tool;

type McpToolTaskSchema = {
  instructions: Array<InstructionSchema>; // 指令序列 调度器会按序列顺序依次执行指令
};

type InstructionSchema = {
  action: string; // 指令类型 对应操作库中的原子操作
  params: {
    // 指令参数
    [props: string]: SerializableType;
  };
};
```

### 参数变量

指令序列中不同的指令类型（action）会不同的指令参数（params），具体可查看[操作库API文档](https://github.com/opentiny/tiny-agent/tree/main/docs/src/api/actions)。
在指令参数中允许使用参数变量，如下所示

```typescript
{
  "action": "input",
  "params": {
    "selector": ".user-input input",
    "value": "{{name}}"
  }
}
```

上面的例子中是一个输入框键入的指令，可以看到指令参数（params）中的value参数是一个变量属性，大模型在调用MCP Tool时TinyAgent会通过McpToolParser工具方法会将参数变量替换为大模型所分析的真实参数，参数变量与inputSchema中的参数定义一一对应
