<script setup>
import ChatDialog from './components/ChatDialog.vue';
import AddUser from './components/AddUser.vue';
import { setupMcpService } from '@opentiny/tiny-agent-mcp-service-vue';
import { EndpointTransport, WebSocketClientEndpoint } from '@opentiny/tiny-agent-mcp-connector';
import { ref } from 'vue';
import { McpToolParser} from '@opentiny/tiny-agent-task-mcp';
import mcpToolJson from './mcp-tool.json';
import { taskScheduler } from './scheduler.js';
const doTask = (task)=> {
  taskScheduler.pushTask(task);
};

const mcp = setupMcpService();
function getWebSocketClientEndpoint() {
  return new WebSocketClientEndpoint({url: 'ws://localhost:8082'});
}
const endpointTransport = new EndpointTransport(getWebSocketClientEndpoint)
mcp.mcpServer.connect(endpointTransport);
new McpToolParser(doTask).extractAllTools(mcpToolJson).forEach((tool) => {
  mcp.mcpServer.registerTool(tool.name, tool.config, tool.cb);
});


const clientId = ref(endpointTransport.clientId);
console.log('Initial Client ID:', clientId.value);
if (!endpointTransport.clientId) {
  endpointTransport.clientIdResolved.then((id) => {
    clientId.value = id;
    console.log('Client ID:', clientId.value);
  });
}
</script>

<template>
  <AddUser />
  <ChatDialog :client-id="clientId" />
</template>
