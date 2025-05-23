<script setup>
import ChatDialog from './components/ChatDialog.vue';
import AddUser from './components/AddUser.vue';
import { setupMcpService } from '@opentiny/tiny-agent-mcp-service/vue/use-mcp-service';
import { startClient } from '@opentiny/tiny-agent-mcp-tool-server/src/socket/client';
import { ref } from 'vue';
import { taskScheduler } from './scheduler';

const mcp = setupMcpService();

const client = startClient(
  (task) => taskScheduler.pushTask(task),
  mcp,
  'ws://127.0.0.1:3001'
);

// 需要唯一标识，区分与服务端链接的每个对话框
const clientId = ref(client.clientId);

setTimeout(() => {
  clientId.value = client.clientId;
}, 1000);
</script>

<template>
  <AddUser />
  <ChatDialog :client-id="clientId" />
</template>
