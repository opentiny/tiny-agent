<script setup lang="ts">
import { ref } from 'vue';
import { setupMcpService } from '@opentiny/tiny-agent-mcp-service-vue';
import { McpValidator } from '@opentiny/tiny-agent-mcp-service';
import {
  EndpointTransport,
  WebSocketClientEndpoint,
} from '@opentiny/tiny-agent-mcp-connector';
import {
  executableTaskSchema,
  McpToolParser,
} from '@opentiny/tiny-agent-task-mcp';
import ChatDialog from './components/ChatDialog.vue';
import AddUser from './components/AddUser.vue';
import mcpToolJson from './mcp-tool.json';
import { taskScheduler } from './scheduler.js';
const doTask = async (task: executableTaskSchema) => {
  return taskScheduler.pushTask(task);
};
const mcpValidator = new McpValidator();
const mcp = setupMcpService();
function getWebSocketClientEndpoint() {
  return new WebSocketClientEndpoint({ url: 'ws://localhost:8082' });
}
const endpointTransport = new EndpointTransport(getWebSocketClientEndpoint);
mcp.mcpServer.connect(endpointTransport);
mcp.setValidator(mcpValidator);
new McpToolParser(doTask).extractAllTools(mcpToolJson).forEach((tool) => {
  mcp.mcpServer.registerTool(tool.name, tool.config, tool.cb);
});

const clientId = ref(endpointTransport.clientId);

if (!endpointTransport.clientId) {
  endpointTransport.clientIdResolved.then((id) => {
    clientId.value = id;
    console.log('Client ID:', clientId.value);
  });
} else {
  console.log('Client ID:', clientId.value);
}
</script>

<template>
  <AddUser />
  <ChatDialog :client-id="clientId" :genCode="mcpValidator.genVerifyCode" />
</template>

<style>
body {
  margin: 0;
  min-height: 100vh;
}
</style>
