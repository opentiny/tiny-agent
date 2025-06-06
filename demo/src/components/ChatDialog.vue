<template>
  <tr-container v-model:fullscreen="fullscreen" v-model:show="show" id="tiny-container">
    <template #title>
      <span></span>
    </template>
    <template #operations> </template>
    <template v-if="messages.length === 0">
      <tr-prompts :items="promptItems" :wrap="true" item-class="prompt-item" class="tiny-prompts"
        @item-click="handlePromptItemClick"></tr-prompts>
    </template>
    <tr-bubble-list v-else :items="showMessages" :roles="roles"> </tr-bubble-list>
    <template #footer>
      <tr-sender class="chat-input" mode="multiple" :maxLength="10000" v-model="inputMessage" :showWordLimit="true"
        ref="senderRef" :placeholder="messageState.status === STATUS.PROCESSING ? '正在思考中...' : '请输入您的问题'"
        :clearable="true" :loading="GeneratingStatus.includes(messageState.status)" @submit="sendMessage"
        @cancel="abortRequest"></tr-sender>
    </template>
  </tr-container>
  <div @click="() => {
    show = !show;
    senderRef?.focus();
  }">
    <slot></slot>
  </div>
</template>

<script setup>
import { AIClient, useMessage, STATUS, GeneratingStatus} from '@opentiny/tiny-robot-kit';
import { ref, watch, nextTick, computed, onUnmounted } from 'vue';
import { CustomModelProvider } from './chat-config/custom-model-provider'
import { SimpleToolCallHandler } from './chat-config/simple-tool-call-handler';
import { roles, promptItems } from './chat-config/chat-config';

const props = defineProps({
  getClientId: { type: Function, default: () => () => '' },
  genCode: { type: Function, default: () => () => { } },
  clearCode: { type: Function, default: () => () => { } },
  memory: { type: Boolean, default: true },
});

const show = defineModel('show', {
  type: Boolean,
  default: true,
});

const fullscreen = ref(false);
const senderRef = ref(null);

// 配置AI对话提供商
const customModelProvider = new CustomModelProvider(
  {
    memory: props.memory,
  }, 
  {
    toolCallHandler: new SimpleToolCallHandler(),
    validator: {
      genCode: props.genCode,
      clearCode: props.clearCode,
    },
    getClientId: props.getClientId
  }
);
onUnmounted(() => { customModelProvider.destroy(); });

// 配置AI对话客户端
const client = new AIClient({
  provider: 'custom',
  providerImplementation: customModelProvider,
});

const { messages, inputMessage, messageState, sendMessage, abortRequest } = useMessage({
  client,
  useStreamByDefault: true,
  initialMessages: [],
});


const handlePromptItemClick = (e, item) => {
  sendMessage(item.description);
};

const showMessages = computed(() => {
  if (messageState.status === STATUS.PROCESSING) {
    return [
      ...messages.value,
      {
        role: 'assistant',
        content: '正在思考中...',
        loading: true,
      },
    ];
  }
  return messages.value;
});

// 最新消息滚动到底部
watch(
  () => messages.value[messages.value.length - 1],
  () => {
    const containerBody = document.querySelector('div.tr-bubble-list');
    if (containerBody) {
      nextTick(() => {
        containerBody.scrollTo({
          top: containerBody.scrollHeight,
          behavior: 'smooth',
        });
      });
    }
  },
);
</script>

<style>
#tiny-container p {
  margin: 0;
  text-align: left;
}

.tr-container__footer {
  padding: 0 16px;
  margin-bottom: 16px;
}

.tr-prompts {
  padding: 0 16px;
}

.prompt-item {
  width: calc(100% - 48px);
}

.tr-bubble__content-wrapper {
  max-width: calc(100% - 56px);
}

.tr-bubbule__body {
  overflow: auto;
}

.tr-prompt__content-label {
  font-size: 1.2em;
}
</style>
