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
  <div @click="
    show = !show;
  senderRef?.focus();
  ">
    <slot></slot>
  </div>
</template>

<script setup>
import { IconAi, IconUser } from '@opentiny/tiny-robot-svgs';
import { h, ref, watch, nextTick, computed, onUnmounted } from 'vue';
import { BaseModelProvider, AIClient, useMessage, STATUS, GeneratingStatus } from '@opentiny/tiny-robot-kit';

const props = defineProps({
  clientId: { type: String, default: () => '' },
  genCode: { type: Function, default: () => () => { } },
  clearCode: { type: Function, default: () => () => { } },
  memory: { type: Boolean, default: true },
});

class SimpleToolCallHandler {
  constructor() {
    this.styleElementIds = new Set();
    this.initStyles();
    this.updateToolTimer = null;
  }

  handler(extra, handler) {
    const element = this.getElement(extra);
    if (!element) {
      const { onData } = handler;
      onData({ choices: [{ delta: { content: this.createElement(extra) } }] });
      this.updateToolTimer = setTimeout(() => {
        this.updateTool(extra);
        this.updateToolTimer = null;
      }, 0);
    } else {
      if (this.updateToolTimer) {
        clearTimeout(this.updateToolTimer);
        this.updateToolTimer = null;
      }
      this.updateTool(extra);
    }
  }

  createElement(extra) {
    this.createStyle(extra);
    return `<div class="tool-call" id="${extra.toolCall.id}"></div>`;
  }

  createStyle(extra) {
    const style = document.createElement('style');
    style.id = `tool_call_${extra.toolCall.id}`;
    document.head.appendChild(style);
    this.styleElementIds.add(style.id);
  }

  getStyle(extra) {
    return document.querySelector(`#tool_call_${extra.toolCall.id}`);
  }

  getElement(extra) {
    return document.querySelector(`div.tool-call#${extra.toolCall.id}`)
  }

  updateTool(extra) {
    const element = this.getElement(extra);
    const style = this.getStyle(extra);
    if (!element || !style) {
      console.warn('no tool call info')
      return;
    }

    if (extra.callToolResult) {
      style.innerHTML = `
       .tool-call#${extra.toolCall.id}::after {
         content: '调用工具 ${extra.toolCall.function.name} ${extra.callToolResult.isError ? '失败 ❌' : '成功 ✅'}'
       }
      `
    } else {
      style.innerHTML = `
       .tool-call#${extra.toolCall.id}::after {
         content: '正在调用工具 ${extra.toolCall.function.name} ...'
       }
         `
    }
  }
  initStyles() {
    const style = document.createElement('style');
    style.id = 'simple-tool-call-handler-base-styles';
    style.innerHTML = `
      .chat-dialog div.tool-call {
        padding: 8px 16px;
        margin: 12px 0;
        background: #EFEFEF;
        border: #EEE 1px solid;
        border-radius: 10px;
      }
    `
    document.head.appendChild(style);
    this.styleElementIds.add(style.id);
  }

  cleanup() {
    if (this.updateToolTimer) {
      clearTimeout(this.updateToolTimer);
      this.updateToolTimer = null;
    }

    this.styleElements.forEach(styleId => {
      const element = document.getElementById(styleId);
      element?.remove();
    });
    this.styleElements.clear();
  }
}

// 自定义模型提供者
class CustomModelProvider extends BaseModelProvider {
  toolCallHandler = new SimpleToolCallHandler();
  constructor(options) {
    super(options);
  }
  validateRequest() { }
  async getData(request) {
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
      body: JSON.stringify(props.memory ? { messages: request.messages } : { query: lastMessage }),
    };

    const response = await fetch(`http://localhost:3001/chat`, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }
    return response;
  }

  async chat(request) {
    try {
      const response = await this.getData(request);
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
    } finally {
      props.clearCode();
    }
  }

  async chatStream(request, handler) {
    const { onData, onDone, onError } = handler;
    let reader = null;
    try {
      const response = await this.getData(request);
      reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // Append new chunk to buffer
        buffer += decoder.decode(value, { stream: true });
        // Process complete lines from buffer
        while (true) {
          const lineEnd = buffer.indexOf('\n');
          if (lineEnd === -1) break;
          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices[0].delta.extra?.toolCall) {
                const extra = parsed.choices[0].delta.extra;
                this.toolCallHandler.handler(extra, handler);
                continue;
              }
              const content = parsed.choices[0].delta.content;
              if (content) {
                onData({ choices: [{ delta: { content } }] });
              }
            } catch (e) {
              // Ignore invalid JSON
            }
          }
        }
      }
      onDone();
    } catch (error) {
      onError(error);
      throw error;
    } finally {
      reader.cancel();
      props.clearCode();
    }
  }

  destroy() {
    this.toolCallHandler.cleanup();
  }

}

const customModelProvider = new CustomModelProvider();
onUnmounted(() => { customModelProvider.destroy(); });

const client = new AIClient({
  provider: 'custom',
  providerImplementation: customModelProvider,
});

// 使用tiny-robot 提供的API
const { messages, inputMessage, messageState, sendMessage, abortRequest } = useMessage({
  client,
  useStreamByDefault: true,
  initialMessages: [],
});

const promptItems = [
  {
    label: '列出工具',
    description: '列出目前系统中可用的工具！',
    icon: h('span', { style: { fontSize: '18px' } }, '🧠'),
    badge: 'NEW',
  },
  {
    label: '界面操作',
    description: '通过界面新增用户 张三 男 2000-1-1',
    icon: h('span', { style: { fontSize: '18px' } }, '🧠'),
    badge: 'NEW',
  },
  {
    label: '函数调用',
    description: '新增用户 李四 女 2000-2-2',
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
