<script setup>
import ChatDialog from './components/ChatDialog.vue';
import AddUser from './components/AddUser.vue';
import { setupMcpService } from '@opentiny/tiny-agent-mcp-service-vue';
import { EndpointTransport, WebSocketClientEndpoint } from '@opentiny/tiny-agent-mcp-connector';
import { ref } from 'vue';
import { McpToolParser} from '@opentiny/tiny-agent-task-mcp';
import mcpToolJson from './mcp-tool.json';

const mcp = setupMcpService();
function getWebSocketClientEndpoint() {
  return new WebSocketClientEndpoint({url: 'ws://localhost:8082'});
}
const endpointTransport = new EndpointTransport(getWebSocketClientEndpoint)
mcp.mcpServer.connect(endpointTransport);
new McpToolParser().extractAllTools(mcpToolJson).forEach((tool) => {
  mcp.mcpServer.tool(tool);
});


const clientId = ref(endpointTransport.clientId);
if (endpointTransport.clientId) {
  endpointTransport.clientResolved.then((id) => {
    clientId.value = id;
  });
}
</script>

<template>
  <AddUser />
  <ChatDialog :client-id="clientId" />
</template>
