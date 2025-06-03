<script setup>
import { ref } from 'vue';
import { setupMcpService } from '@opentiny/tiny-agent-mcp-service-vue';
import { McpValidator } from '@opentiny/tiny-agent-mcp-service';
import AiChatSvg from './assets/ai-chat.svg?url';
import { EndpointTransport, WebSocketClientEndpoint } from '@opentiny/tiny-agent-mcp-connector';
import { McpToolParser } from '@opentiny/tiny-agent-task-mcp';
import ChatDialog from './components/ChatDialog.vue';
import AddUser from './components/AddUser.vue';
import mcpToolJson from './mcp-tool.json';
import { taskScheduler } from './scheduler.js';
const doTask = async (task) => {
  return taskScheduler.pushTask(task);
};
const mcpValidator = new McpValidator();
const mcp = setupMcpService();
const wsEndpoint = new WebSocketClientEndpoint({ url: 'ws://localhost:3001/ws' });
const endpointTransport = new EndpointTransport(wsEndpoint);
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

const showChat = ref(true);
</script>

<template>
  <AddUser />
  <ChatDialog
    :client-id="clientId"
    :genCode="mcpValidator.genVerifyCode"
    :clearCode="mcpValidator.clearVerifyCode"
    v-model:show="showChat"
  />
  <div class="ai-chat-toggle" title="打开AI对话框" v-show="!showChat" @click="showChat = true">
    <img :src="AiChatSvg" />
  </div>
</template>

<style>
body {
  margin: 0;
  min-height: 100vh;
}
</style>
<style scoped>
.ai-chat-toggle {
  position: fixed;
  top: 50%;
  right: 20px;
  width: 50px;
  height: 50px;
  cursor: pointer;
}
</style>
