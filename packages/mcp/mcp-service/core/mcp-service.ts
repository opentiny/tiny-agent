import { ZodRawShape } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export interface ITool {
    name: string;
    description: string;
    inputSchema: ZodRawShape;
}
export interface IResource {
    name: string;
    description: string;
    element: HTMLElement;
}
export interface IUIResource extends IResource {}

export const MCP_SERVICE = Symbol('MCP_SERVICE');

export class McpService {
  static toolToJson(tool: ITool): any {
    return {
      name: tool.name,
      description: tool.description,
      inputSchema: Object.fromEntries(
        Object.entries(tool.inputSchema)
          .map(([key, value]) => [key, zodToJsonSchema(value)]
        )
      )
    };
  }
  private tools = new Map<string, ITool>();
  private uiResources = new Map<string, IUIResource>();

  registerTool(tool: ITool) {
    if (this.tools.has(tool.name)) {
      return;
    }
    this.tools.set(tool.name, tool);
  }

  unregisterTool(name: string) {
    if (!this.tools.has(name)) {
      return;
    }
    this.tools.delete(name);
  }

  getTool(name: string): ITool | undefined {
    return this.tools.get(name);
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

  getAllTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  getAllResources(): IUIResource[] {
    return Array.from(this.uiResources.values());
  }

}
