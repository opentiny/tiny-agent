import type { Tool } from '@modelcontextprotocol/sdk/types.js';

import { v4 as uuidv4 } from 'uuid'
import { getZodRawShape } from './utils';
import { z, ZodRawShape } from 'zod';
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
        instruction.params[key] = instruction.params[key].replaceAll(this.placeholder(paramsKey), paramsValue);
      }
    });
  }

  extractTool(mcpToolSchema: McpToolSchema): McpTool {
    const { name, task, inputSchema, outputSchema, ...config } = structuredClone(mcpToolSchema)
    const zodInputSchema = getZodRawShape(inputSchema as McpToolSchema['inputSchema']);
    const taskOutputSchema = this.getTaskOutputSchema()
    const cb = async (args: any) => {
      const variables = Object.keys(inputSchema.properties || {});
      const realTask = variables.reduce((accTask: executableTaskSchema, cur) => {
        accTask.instructions.forEach(instruction => {
          this.replaceInstructionParamValue(instruction, cur, args[cur])
        });
        return accTask;
      }, {
        id: genTaskId(),
        instructions: structuredClone(task.instructions)
      });
      const result = await this.doTask(realTask)
      return {
        structuredContent: result,
        content: [{
          type: 'text',
          text: result.status
        }]
      }
    }
    return {
      name,
      config: {
        inputSchema: zodInputSchema,
        outputSchema: taskOutputSchema,
        ...config,
      },
      cb 
    }
  }

  extractAllTools(mcpToolsSchema: McpToolsSchema): Array<McpTool> {
    return mcpToolsSchema.tools.map((tool) => this.extractTool(tool));
  }

  getTaskOutputSchema(outputSchema: ZodRawShape = {}): ZodRawShape {
    const instructionZod = z.object({
        action: z.string().describe('failed instruction action'),
        params: z.object({}).passthrough().describe('failed instruction action parameters'),
        // only zod 4 support declaration below, mcp now use zod 3
        // get catchInstruction() {
        //   return instructionZod.optional()
        // }
        catchInstruction: z.object({}).passthrough().optional().describe('fall back instruction if occur error')
    });
    return {
      status: z.enum(['success', 'error', 'partial completed']).describe('task status'),
      index: z.number().describe('failed step'),
      instruction: instructionZod.optional().describe('failed instruction detail'),
      result: z.object(outputSchema).passthrough().optional().describe('task result if run task to obtain some content'),
      error: z.object({
        message: z.string().describe('error message'),
        stack: z.string().optional().describe('error stack')
      }).optional().describe('error information if occur error')
    }
  }
}
