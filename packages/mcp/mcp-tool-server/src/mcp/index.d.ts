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

export type McpToolParam = {
  type: string
  name: string
}

export type McpToolTaskSchema = {
  id: string
  instruction: Array<Instruction>
}

export type McpTool = {
  name: string
  description: string
  inputSchema: any
  task: McpToolTaskSchema
}
