<script setup>
import { ref, provide } from 'vue';
import { setupMcpService } from '@opentiny/tiny-agent-mcp-service-vue';
import { createMCPClientChat } from '@opentiny/tiny-agent-mcp-client-chat';
import { McpToolParser } from '@opentiny/tiny-agent-task-mcp';
import ChatDialog from './components/ChatDialog.vue';
import AddUser from './components/AddUser.vue';
import mcpToolJson from './mcp-tool.json';
import { taskScheduler } from './scheduler.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  TinyButton,
  TinyModal
} from '@opentiny/vue';

// Transports
const [ clientTransport, serverTransport ] = InMemoryTransport.createLinkedPair();

// MCP Service
const mcp = setupMcpService();
mcp.mcpServer.connect(serverTransport);

// handle mcp-tool.json
const doTask = async (task) => {
  return taskScheduler.pushTask(task);
};
new McpToolParser(doTask).extractAllTools(mcpToolJson).forEach((tool) => {
  mcp.mcpServer.registerTool(tool.name, tool.config, tool.cb);
});

// AI dialog
const showChat = ref(true);

// MCP Client Chat
const chatConfig = {
  llmConfig: {
    url: 'http://localhost:11434/v1/chat/completions',
    apiKey: '',
    model: 'qwen2.5:7b',
    systemPrompt: 'You are a helpful assistant',
  },
  maxIterationSteps: 3,
  mcpServersConfig: {
    mcpServers: {
      'current-page': {
        customTransport: clientTransport
      }
    },
  },
}
const chatFactory = () => createMCPClientChat(chatConfig);
provide('chat-factory', chatFactory);


</script>

<template>
  <div class="header">
    <tiny-button>配置 LLM</tiny-button>
    <tiny-button :disabled="showChat" @click="showChat = true">打开AI对话框</tiny-button>
  </div>

  <AddUser />
  <ChatDialog v-model:show="showChat" />

</template>

<style>
.vitepress-demo-plugin-preview {
  margin: 0;
  min-height: max(calc(100vh - 400px), 300px);
}
</style>
<style scoped>
.header {
  display: flex;
  justify-content: space-between;
}
</style>
