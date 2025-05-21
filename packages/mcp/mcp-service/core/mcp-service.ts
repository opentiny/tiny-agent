import { McpServer, RegisteredTool, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ZodRawShape } from 'zod';
export interface ITool {
  name: string;
  description: string;
  inputSchema: ZodRawShape;
  handler: (...args: any[]) => Promise<any>;
}
export interface IResource {
  name: string;
  description: string;
  element: HTMLElement;
}
export interface IUIResource extends IResource { }

export const MCP_SERVICE = Symbol('MCP_SERVICE');
export class McpService {
  private _mcpServer: McpServer;
  private uiResources = new Map<string, IUIResource>();
  public get mcpServer() {
    return this._mcpServer;
  }
  constructor(mcpServer?: McpServer) {
    this._mcpServer = mcpServer || new McpServer({
      name: 'MCP Service',
      version: '1.0.0',
    });
  }

  registerTool(tool: ITool) {
    const { name, description, inputSchema, handler } = tool;
    return this.mcpServer.tool(name, description, inputSchema, handler);
  }

  unregisterTool(name: string) {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool with name ${name} does not exist`);
    }
    tool.remove();
    return tool;
  }

  getTool(name: string): RegisteredTool & { name: string } | undefined {
    return {
      ...this.mcpServer["_registeredTools"][name],
      name
    };
  }

  registerUIResource(resource: IUIResource) {
    if (this.uiResources.has(resource.name)) {
      throw new Error(`UI Resource with name ${resource.name} already exists`);
    }
    this.uiResources.set(resource.name, resource);
  }

  unregisterUIResource(name: string) {
    if (!this.uiResources.has(name)) {
      throw new Error(`UI Resource with name ${name} does not exist`);
    }
    this.uiResources.delete(name);
  }
  getUIResource(name: string): IUIResource | undefined {
    return this.uiResources.get(name);
  }

  getAllTools(): (RegisteredTool & { name: string })[] {
    return Object.keys(this.mcpServer["_registeredTools"]).map(name => {
      const tool = this.mcpServer["_registeredTools"][name] as RegisteredTool;
      return {
        name,
        ...tool
      };
    });
  }

  getAllUIResources(): IUIResource[] {
    return Array.from(this.uiResources.values());
  }

  getContext() {
    return {
      tools: Object.fromEntries(this.getAllTools().map(tool => [tool.name, tool.callback])),
      resources: {
        ui: Object.fromEntries(this.getAllUIResources().map(resource => [resource.name, resource.element]))
      },
    };
  }
}
