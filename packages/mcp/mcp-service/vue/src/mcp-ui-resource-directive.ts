import { DirectiveBinding } from 'vue';
import { MCP_SERVICE, McpService, type IUIResource } from '@opentiny/tiny-agent-mcp-service';
export interface IMcpUiResourceBinding extends IUIResource { }
export default {
  name: 'McpUIResourceDirective',
  mounted(el: HTMLElement, binding: DirectiveBinding<IMcpUiResourceBinding>, vNode: any) {
    el.setAttribute('data-mcp-ui-resource', binding.value.name);
    const mcpService = vNode.ctx.providers[MCP_SERVICE] as McpService;
    if (!mcpService) {
      throw new Error('McpService not found');
    }
    const uiResource = {
      ...binding.value,
      element: el,
    };
    mcpService.registerUIResource(uiResource);
  },
  beforeUnmount(el: HTMLElement, binding: DirectiveBinding<IMcpUiResourceBinding>, vNode: any) {
    el.removeAttribute('data-mcp-ui-resource');
    const mcpService = vNode.ctx.providers[MCP_SERVICE] as McpService;
    if (!mcpService) {
      throw new Error('McpService not found');
    }
    const { name } = binding.value;
    mcpService.unregisterUIResource(name);
  },
}
