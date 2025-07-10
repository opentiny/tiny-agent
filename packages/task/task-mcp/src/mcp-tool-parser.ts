import type { Tool, Request, Notification } from '@modelcontextprotocol/sdk/types.js';
import { DEFAULT_REQUEST_TIMEOUT_MSEC, type RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type { ITaskOptions, Task } from '@opentiny/tiny-agent-task-runtime-service';
import { v4 as uuidv4 } from 'uuid';
import { type ZodRawShape, z } from 'zod';
import { getZodRawShape } from './utils';
export const genTaskId = () => uuidv4();

export type SerializableType =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<SerializableType>
  | { [key: string]: SerializableType };
export type InstructionSchema = {
  action: string;
  params: Record<string, SerializableType>;
};
export type McpToolsSchema = {
  tools: Array<McpToolSchema>;
};

export type McpToolTaskSchema = {
  instructions: Array<InstructionSchema>;
};
export type executableTaskSchema = {
  id: string;
} & McpToolTaskSchema;

export type McpToolSchema = {
  name: string;
  task: McpToolTaskSchema;
} & Tool;

export type McpTool = {
  name: string;
  config: Omit<Tool, 'name'>;
  cb: (args: any, extra?: any) => Promise<any>;
};

export class McpToolParser {
  public placeholder = (key: string) => `{{${key}}}`;
  protected doTask: (task: executableTaskSchema, taskOption?: ITaskOptions) => Promise<any>;
  constructor(
    doTask: (task: executableTaskSchema, taskOption?: ITaskOptions) => Promise<any>,
    placeholderFn?: (key: string) => string,
  ) {
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
    const { name, task, inputSchema, outputSchema, ...config } = structuredClone(mcpToolSchema);
    const zodInputSchema = getZodRawShape(inputSchema as McpToolSchema['inputSchema']);
    const taskOutputSchema = this.getTaskOutputSchema(
      outputSchema ? getZodRawShape(outputSchema as McpToolSchema['inputSchema']) : undefined,
    );
    const cb = async (args: any, extra: RequestHandlerExtra<Request, Notification>) => {
      const variables = Object.keys(inputSchema.properties || {});
      const realTask = variables.reduce(
        (accTask: executableTaskSchema, cur) => {
          accTask.instructions.forEach((instruction) => {
            this.replaceInstructionParamValue(instruction, cur, args[cur]);
          });
          return accTask;
        },
        {
          id: genTaskId(),
          instructions: structuredClone(task.instructions),
        },
      );

      const result = await this.doTask(realTask, {
        onCreated: (task: Task) => {
          if (extra?._meta?.progressToken) {
            let timeout: number | null = null;
            task.on('beforeStep', () => {
              this.sendTaskProgressNotification(task, extra);
            });
            task.on('pause', () => {
              this.sendTaskProgressNotification(task, extra);
              timeout = setInterval(() => {
                this.sendTaskProgressNotification(task, extra);
              }, DEFAULT_REQUEST_TIMEOUT_MSEC * 0.5);
            });
            task.on('resume', () => {
              if (timeout) {
                clearInterval(timeout);
                timeout = null;
              }
            });
            task.on('finish', () => {
              if (timeout) {
                clearInterval(timeout);
                timeout = null;
              }
            });
          }
        },
      }).catch((error) => {
        if (error instanceof Error) {
          return {
            status: 'error',
            index: 0,
            error: {
              message: error.message,
              stack: error.stack,
            },
          };
        }
        return error;
      });
      return {
        structuredContent: result,
        content: [
          {
            type: 'text',
            text: result.status,
          },
        ],
        isError: result.status !== 'success',
      };
    };
    return {
      name,
      config: {
        inputSchema: zodInputSchema,
        outputSchema: taskOutputSchema,
        ...config,
      },
      cb,
    };
  }

  extractAllTools(mcpToolsSchema: McpToolsSchema): Array<McpTool> {
    return mcpToolsSchema.tools.map((tool) => this.extractTool(tool));
  }

  sendTaskProgressNotification(task: Task, extra: RequestHandlerExtra<Request, Notification>) {
    const i = task['executorInfo'].currentIndex + 1;
    const steps = task['executorInfo'].instructions.length;
    const status = task['executorInfo'].status;
    extra.sendNotification({
      method: 'notifications/progress',
      params: {
        progressToken: extra._meta?.progressToken,
        progress: i,
        total: steps,
        message: `Completed step ${i} of ${steps} ${status === 'paused' ? '(Paused)' : ''}`,
        status,
      },
    });
  }

  getTaskOutputSchema(outputSchema: ZodRawShape = {}): ZodRawShape {
    const instructionZod = z.object({
      action: z.string().describe('failed instruction action'),
      params: z.object({}).passthrough().describe('failed instruction action parameters'),
      // only zod 4 support declaration below, mcp now use zod 3
      // get catchInstruction() {
      //   return instructionZod.optional()
      // }
      catchInstruction: z.object({}).passthrough().optional().describe('fall back instruction if occur error'),
    });
    return {
      status: z.enum(['success', 'error', 'partial completed']).describe('task status'),
      index: z.number().describe('failed step'),
      instruction: instructionZod.optional().describe('failed instruction detail'),
      result: z
        .object(outputSchema)
        .passthrough()
        .optional()
        .describe('task result if run task to obtain some content'),
      error: z
        .object({
          message: z.string().describe('error message'),
          stack: z.string().optional().describe('error stack'),
        })
        .optional()
        .describe('error information if occur error'),
    };
  }
}
