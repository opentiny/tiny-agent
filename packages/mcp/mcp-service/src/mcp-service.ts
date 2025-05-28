import {
  McpServer,
  RegisteredTool
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { mergeCapabilities } from '@modelcontextprotocol/sdk/shared/protocol.js';
import { ZodRawShape } from 'zod';
import { McpValidator } from './mcp-validator';
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
export interface IUIResource extends IResource {}

export const MCP_SERVICE = Symbol('MCP_SERVICE');
export class McpService {
  protected _mcpServer: McpServer;
  protected mcpValidator!: McpValidator;
  protected uiResources = new Map<string, IUIResource>();
  public get mcpServer() {
    return this._mcpServer;
  }
  constructor(mcpServer?: McpServer) {
    this._mcpServer =
      mcpServer ||
      new McpServer({
        name: 'MCP Service',
        version: '1.0.0'
      });
    this.override();
  }

  protected override() {
    // prevent dynamic registration tool errors after connecting to transport, version 1.11.x
    this.mcpServer.server.registerCapabilities = (capabilities) => {
      this.mcpServer.server['_capabilities'] = mergeCapabilities(
        this.mcpServer.server['_capabilities'],
        capabilities
      );
    };
  }

  setValidator(validator: McpValidator) {
    this.mcpValidator = validator;
  }

  registerTool(...args: Parameters<McpServer['tool']>): RegisteredTool {
    return this.mcpServer.tool(...args);
  }

  unregisterTool(name: string) {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool with name ${name} does not exist`);
    }
    tool.remove();
    return tool;
  }

  getTool(name: string): (RegisteredTool & { name: string }) | undefined {
    const tool = this.mcpServer['_registeredTools'][name];
    if (!tool) {
      return undefined;
    }
    return {
      ...tool,
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
    return Object.keys(this.mcpServer['_registeredTools']).map((name) => {
      const tool = this.mcpServer['_registeredTools'][name] as RegisteredTool;
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
      tools: Object.fromEntries(
        this.getAllTools().map((tool) => [tool.name, tool.callback])
      ),
      resources: {
        ui: Object.fromEntries(
          this.getAllUIResources().map((resource) => [
            resource.name,
            resource.element
          ])
        )
      }
    };
  }
}
