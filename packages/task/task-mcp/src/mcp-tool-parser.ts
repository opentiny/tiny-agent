import type { Tool } from '@modelcontextprotocol/sdk/types.js';

import { v4 as uuidv4 } from 'uuid'
import { getZodRawShape } from './utils';
export const genTaskId = () => uuidv4()

export type SerializableType = string | number | boolean | null | undefined | Array<SerializableType> | { [key: string]: SerializableType }
export type InstructionSchema = {
  action: string
  params: {
    [props: string]: SerializableType
  }
}
export type McpToolsSchema = {
  tools: Array<McpToolSchema>;
}

export type McpToolTaskSchema = {
  instructions: Array<InstructionSchema>;
}
export type executableTaskSchema = {
  id: string
} & McpToolTaskSchema;

export type McpToolSchema = {
  name: string
  task: McpToolTaskSchema
} & Tool;

export type McpTool = {
  name: string;
  config: Omit<Tool, 'name'>;
  cb: (args: any) => Promise<any>;
}

export class McpToolParser {
  public placeholder = (key: string) => `{{${key}}}`
  protected doTask: (task: executableTaskSchema) => Promise<any>;
  constructor(doTask: (task: executableTaskSchema) => Promise<any>, placeholderFn?: (key: string) => string) {
    this.doTask = doTask;
    if (placeholderFn) {
      this.placeholder = placeholderFn;
    }
  }
  replaceInstructionParamValue(instruction: InstructionSchema, paramsKey: string, paramsValue: any): void {
    Object.keys(instruction.params).forEach((key) => {
      if (typeof instruction.params[key] === 'string') {
        instruction.params[key] = instruction.params[key].replace(this.placeholder(paramsKey), paramsValue);
      }
    });
  }

  extractTool(mcpToolSchema: McpToolSchema): McpTool {
    const { name, task, inputSchema, outputSchema, ...config } = structuredClone(mcpToolSchema)
    const zodInputSchema = getZodRawShape(inputSchema as McpToolSchema['inputSchema']);
    const zodOutputSchema = outputSchema? getZodRawShape(outputSchema as McpToolSchema['inputSchema']): undefined;
    const cb = async (args: any) => {
      const variables = Object.keys(inputSchema.properties || {});
      const realTask = variables.reduce((accTask: executableTaskSchema, cur) => {
        accTask.instructions.forEach(instruction => {
          this.replaceInstructionParamValue(instruction, cur, args[cur])
        });
        return accTask;
      }, {
        id: genTaskId(),
        instructions: task.instructions
      });
      console.log(realTask)
      return this.doTask(realTask)
    }
    return {
      name,
      config: {
        inputSchema: zodInputSchema,
        outputSchema: zodOutputSchema,
        ...config,
      },
      cb
    }
  }

  extractAllTools(mcpToolsSchema: McpToolsSchema): Array<McpTool> {
    return mcpToolsSchema.tools.map((tool) => this.extractTool(tool));
  }
}
