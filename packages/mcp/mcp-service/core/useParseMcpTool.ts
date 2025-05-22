type Instruction = {
  action: string
  params: {
    selector: string
    to?: string
    title?: string
    text?: string
    value?: string
  }
}

type McpToolTaskSchema = {
  id: string
  instruction: Array<Instruction>
}

type McpTool = {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: any
  }
  task?: McpToolTaskSchema
  args?: Record<string, any>
}

export function useParseMcpTool(doTask) {
  function replaceArgs(
    task: McpToolTaskSchema,
    inputSchema: any,
    actualArgs: any[]
  ) {
    let schemaStr = JSON.stringify(task)
    let taskSchema: McpToolTaskSchema

    // 替换实参
    if (actualArgs) {
      Object.keys(inputSchema.properties)?.forEach((param, index) => {
        schemaStr = schemaStr
          .split(`{{${param}}}`)
          .join(actualArgs[index]?.toString())
      })
    }

    try {
      taskSchema = JSON.parse(schemaStr)
    } catch {
      taskSchema = task
    }

    return taskSchema
  }

  function parseTool(tool: McpTool) {
    const { name, description, inputSchema, task } = tool
    const handle = (...args) => {
      const pendingTask = task ? replaceArgs(task, inputSchema, args) : args
      doTask(pendingTask)
    }

    return {
      name,
      description,
      inputSchema,
      handle,
    }
  }

  function parse(mcpJson) {
    try {
      const tools = JSON.parse(mcpJson)

      return tools.map(parseTool)
    } catch (e) {
      console.error('Invalid MCP JSON Data')

      return []
    }
  }

  return {
    parse,
  }
}
