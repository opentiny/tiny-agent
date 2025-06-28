<script setup>
import { ref, provide } from 'vue';
import { setupMcpService } from '@opentiny/tiny-agent-mcp-service-vue';
import { createMCPClientChat } from '@opentiny/tiny-agent-mcp-client-chat';
import { McpToolParser } from '@opentiny/tiny-agent-task-mcp';
import ChatDialog from './components/ChatDialog.vue';
import AddUser from './components/AddUser.vue';
import LLMConfig from './components/LLMConfig.vue';
import mcpToolJson from './mcp-tool.json';
import { taskScheduler } from './scheduler.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { TinyButton } from '@opentiny/vue';

// Transports
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

// MCP Service
const mcp = setupMcpService();
mcp.mcpServer.connect(serverTransport);

// handle mcp-tool.json
const doTask = async (task, opt) => {
  return taskScheduler.pushTask(task, opt);
};
new McpToolParser(doTask).extractAllTools(mcpToolJson).forEach((tool) => {
  mcp.mcpServer.registerTool(tool.name, tool.config, tool.cb);
});

// AI dialog
const showChat = ref(true);

// MCP Client Chat
const chatConfig = {
  agentStrategy: null,
  llmConfig: {},
  maxIterationSteps: 3,
  mcpServersConfig: {
    mcpServers: {
      'current-page': {
        customTransport: clientTransport,
      },
    },
  },
};
const setLLMConfig = (config) => {
  const { url, apiKey, model, systemPrompt, agentStrategy } = config;
  chatConfig.llmConfig = { url, apiKey, model, systemPrompt };
  chatConfig.agentStrategy = agentStrategy;
};
const chatFactory = () => createMCPClientChat(chatConfig);
provide('chat-factory', chatFactory);
</script>

<template>
  <div class="header">
    <LLMConfig @LLMConfigChange="setLLMConfig" />
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
