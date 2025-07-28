import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import z from 'zod';
import * as charts from './charts/index.js';
import { zodToJsonSchema } from './utils/index.js';

export function registerTools(server: McpServer) {
  Object.entries(charts).forEach(([_key, value]) => {
    const { schema, tool } = value;
    const { name, description, inputSchema, handler } = tool;
    const outputSchema = {
      component: z.string(),
    };
    server.registerTool(
      name,
      {
        description,
        inputSchema: schema, 
        outputSchema,
      },
      (...args: any[]) => {
        return handler(args);
      },
    );
  });
}
