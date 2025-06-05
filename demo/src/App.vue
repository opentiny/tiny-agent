<script setup>
import { ref } from 'vue';
import ChatDialog from './components/ChatDialog.vue';
import AddUser from './components/AddUser.vue';
import AiChatSvg from './assets/ai-chat.svg?url';
import { initMcp } from './mcp';

const { endpointTransport, mcpValidator } = initMcp();

const clientId = ref(endpointTransport.clientId);
if (process.env.NODE_ENV === 'development') {
  if (!endpointTransport.clientId) {
    endpointTransport.clientIdResolved.then((id) => {
      clientId.value = id;
      console.log('Client ID:', clientId.value);
    });
  } else {
    console.log('Client ID:', clientId.value);
  }
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
