<template>
  <tr-container
    v-model:fullscreen="fullscreen"
    v-model:show="show"
    id="tiny-container"
  >
    <template #title>
      <span></span>
    </template>
    <template #operations> </template>
    <template v-if="messages.length === 0">
      <tr-prompts
        :items="promptItems"
        :wrap="true"
        item-class="prompt-item"
        class="tiny-prompts"
        @item-click="handlePromptItemClick"
      ></tr-prompts>
    </template>
    <tr-bubble-list v-else :items="showMessages" :roles="roles">
    </tr-bubble-list>
    <template #footer>
      <tr-sender
        class="chat-input"
        mode="multiple"
        :maxLength="10000"
        v-model="inputMessage"
        :showWordLimit="true"
        ref="senderRef"
        :placeholder="
          messageState.status === STATUS.PROCESSING
            ? '正在思考中...'
            : '请输入您的问题'
        "
        :clearable="true"
        :loading="GeneratingStatus.includes(messageState.status)"
        @submit="sendMessage"
        @cancel="abortRequest"
      ></tr-sender>
    </template>
  </tr-container>
  <div
    @click="
      show = !show;
      senderRef?.focus();
    "
  >
    <slot></slot>
  </div>
</template>

<script setup>
import { IconAi, IconUser } from '@opentiny/tiny-robot-svgs';
import { h, ref, watch, nextTick, computed } from 'vue';
import {
  BaseModelProvider,
  AIClient,
  useMessage,
  STATUS,
  GeneratingStatus,
} from '@opentiny/tiny-robot-kit';

const props = defineProps({
  clientId: { type: String, default: () => '' },
  genCode: { type: Function, default: () => () => {} },
  memory: { type: Boolean, default: true}
});

// 自定义模型提供者
class CustomModelProvider extends BaseModelProvider {
  constructor(options) {
    super(options);
  }
  validateRequest() {}
  async chat(request) {
    try {
      this.validateRequest(request);

      const verifyCode = await props.genCode();
      const lastMessage = request.messages[request.messages.length - 1].content;
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'connector-client-id': props.clientId,
          'mcp-verify-code': verifyCode,
        },
        body: JSON.stringify(
          props.memory 
          ? { messages: request.messages}
          : { query: lastMessage }
        )
      };

      const response = await fetch(`http://localhost:3001/chat`, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, details: ${errorText}`
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let text = '';

      // 逐块读取流数据
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream complete');
          break;
        }
        const chunk = decoder.decode(value, { stream: true });

        try {
          const message = JSON.parse(chunk.slice(6));
          console.log(message); // 输出流的每一部分
          text += message.choices[0].delta.content;
        } catch (error) {
          text += '';
        }
      }
      return { choices: [{ message: { content: text } }] };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

const customModelProvider = new CustomModelProvider();

const client = new AIClient({
  provider: 'custom',
  providerImplementation: customModelProvider,
});

// 使用tiny-robot 提供的API
const { messages, inputMessage, messageState, sendMessage, abortRequest } =
  useMessage({
    client,
    useStreamByDefault: false,
    initialMessages: [],
  });

const promptItems = [
  {
    label: '指导场景',
    description: '列出目前系统中可用的工具！',
    icon: h('span', { style: { fontSize: '18px' } }, '🧠'),
    badge: 'NEW',
  },
];

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
const show = defineModel('show', {
  type: Boolean,
  default: true,
});
const fullscreen = ref(false);
const senderRef = ref(null);

const aiAvatar = h(IconAi, { style: { fontSize: '32px' } });
const userAvatar = h(IconUser, { style: { fontSize: '32px' } });

// 定义角色图标以及样式
const roles = {
  assistant: {
    placement: 'start',
    avatar: aiAvatar,
    maxWidth: '90%',
    type: 'markdown',
    mdConfig: { html: true },
  },
  user: {
    placement: 'end',
    avatar: userAvatar,
    maxWidth: '90%',
    type: 'markdown',
    mdConfig: { html: true },
  },
};

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
  }
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
</style>
