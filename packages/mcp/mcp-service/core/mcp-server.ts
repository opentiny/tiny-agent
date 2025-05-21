import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Resource, ResourceTemplate, Tool } from '@modelcontextprotocol/sdk/types.js';

type DynamicTool = Tool & { callback: (args: any) => Promise<any> };
type DynamicResources = Resource;
type dynamicResourceTemplates = ResourceTemplate;
export class DynamicMcpServer extends McpServer {
  private dynamicTools: Map<string, DynamicTool> = new Map();
  private dynamicResources: Map<string, DynamicResources> = new Map();
  private dynamicResourceTemplates: Map<string, dynamicResourceTemplates> = new Map();
  private dynamicPrompts: Map<string, any> = new Map();

  registerDynamicTool(name: string, tool: any) {
    if (this.dynamicTools.has(name)) {
      throw new Error(`Tool with name ${name} already exists`);
    }
    this.dynamicTools.set(name, tool);
  }
  unregisterDynamicTool(name: string, tool: any) {
    if (!this.dynamicTools.has(name)) {
      throw new Error(`Tool with name ${name} does not exist`);
    }
    this.dynamicTools.delete(name);
  }
  getDynamicTool(name: string): DynamicTool | undefined {
    return this.dynamicTools.get(name);
  }

  registerDynamicResource(name: string, resource: DynamicResources) {
    if (this.dynamicResources.has(name)) {
      throw new Error(`Resource with name ${name} already exists`);
    }
    this.dynamicResources.set(name, resource);
  }
  unregisterDynamicResource(name: string) {
    if (!this.dynamicResources.has(name)) {
      throw new Error(`Resource with name ${name} does not exist`);
    }
    this.dynamicResources.delete(name);
  }
  getDynamicResource(name: string): DynamicResources | undefined {
    return this.dynamicResources.get(name);
  }
  registerDynamicResourceTemplate(name: string, resourceTemplate: dynamicResourceTemplates) {
    if (this.dynamicResourceTemplates.has(name)) {
      throw new Error(`Resource template with name ${name} already exists`);
    }
    this.dynamicResourceTemplates.set(name, resourceTemplate);
  }

  private hackRegisteredInfo() {
    this['_registeredTools'] = new Proxy()
  }
}