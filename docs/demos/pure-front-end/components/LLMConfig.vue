<template>
  <div>
    <!-- 弹框触发按钮 -->
    <TinyButton type="primary" @click="openDialog">配置 LLM</TinyButton>

    <!-- 弹框内容 -->
    <TinyDialogBox v-model:visible="dialogVisible" title="大模型配置" width="500px">
      <TinyForm :model="formData" label-width="80px" ref="formRef">
        <!-- API 地址输入框 -->
        <TinyFormItem label="API 地址">
          <TinyInput v-model="formData.url" placeholder="请输入 API 地址" />
        </TinyFormItem>

        <!-- API Key 输入框（密码类型） -->
        <TinyFormItem label="API Key">
          <TinyInput v-model="formData.apiKey" type="password" placeholder="请输入 API Key" />
        </TinyFormItem>

        <!-- 模型名称输入框 -->
        <TinyFormItem label="模型名称">
          <TinyInput v-model="formData.model" placeholder="请输入模型名称" />
        </TinyFormItem>

        <!-- 系统提示输入框 -->
        <TinyFormItem label="系统提示">
          <TinyInput v-model="formData.systemPrompt" placeholder="请输入系统提示词" />
        </TinyFormItem>

        <!-- 模式选择 -->
        <TinyFormItem label="调用模式">
          <TinySelect v-model="formData.agentStrategy" placeholder="选择调用模式" style="width: 180px">
            <TinyOption label="Function Call" value="Function Calling" />
            <TinyOption label="ReAct" value="ReAct" />
          </TinySelect>
          <div class="mode-des" style="margin-top: 8px">FunctionCalling：适配支持工具调用的大模型</div>
          <div class="mode-des">ReAct：适配不支持工具调用的大模型</div>
        </TinyFormItem>

        <!-- 持久化存储 Checkbox -->
        <TinyFormItem label="持久保存">
          <TinyCheckbox v-model="formData.isPersistent" @change="handlePersistentChange">
            勾选后配置将保存到本地存储
          </TinyCheckbox>
        </TinyFormItem>
      </TinyForm>

      <!-- 弹框底部按钮 -->
      <template #footer>
        <div class="dialog-footer">
          <TinyButton @click="dialogVisible = false">取消</TinyButton>
          <TinyButton type="primary" @click="saveConfig">保存配置</TinyButton>
        </div>
      </template>
    </TinyDialogBox>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  TinyButton,
  TinyDialogBox,
  TinyForm,
  TinyFormItem,
  TinyInput,
  TinyCheckbox,
  TinySelect,
  TinyOption,
} from '@opentiny/vue';

const emit = defineEmits(['LLMConfigChange']);

// 响应式状态
const dialogVisible = ref(false);
const formData = ref({
  url: '',
  apiKey: '',
  model: '',
  systemPrompt: '',
  isPersistent: false,
  agentStrategy: 'Function Calling', // 默认Function Call模式
});

// 初始化时加载本地存储
onMounted(() => {
  loadFromLocalStorage();
});

// 加载本地存储数据
const loadFromLocalStorage = () => {
  formData.value = {
    url: localStorage.getItem('url') || 'http://localhost:11434/v1/chat/completions',
    apiKey: localStorage.getItem('apiKey') || '',
    model: localStorage.getItem('model') || 'qwen2.5:7b',
    systemPrompt: localStorage.getItem('systemPrompt') || 'You are a helpful assistant',
    isPersistent: !!localStorage.getItem('isPersistent'), // 转换为布尔值
    agentStrategy: localStorage.getItem('agentStrategy'),
  };
  emit('LLMConfigChange', formData.value);
};

// 保存配置
const saveConfig = () => {
  emit('LLMConfigChange', formData.value);

  // 处理持久化存储
  if (formData.value.isPersistent) {
    saveToLocalStorage();
  } else {
    clearLocalStorage();
  }

  dialogVisible.value = false;
};

// 写入本地存储
const saveToLocalStorage = () => {
  const { url, apiKey, model, systemPrompt, isPersistent, agentStrategy } = formData.value;
  localStorage.setItem('url', url);
  localStorage.setItem('apiKey', apiKey);
  localStorage.setItem('model', model);
  localStorage.setItem('systemPrompt', systemPrompt);
  localStorage.setItem('isPersistent', isPersistent ? 'true' : 'false');
  localStorage.setItem('agentStrategy', agentStrategy);
};

// 清空本地存储
const clearLocalStorage = () => {
  localStorage.removeItem('url');
  localStorage.removeItem('apiKey');
  localStorage.removeItem('model');
  localStorage.removeItem('systemPrompt');
  localStorage.removeItem('isPersistent');
  localStorage.removeItem('agentStrategy');
};

// Checkbox 状态变更处理
const handlePersistentChange = (val) => {
  if (!val) {
    clearLocalStorage(); // 取消勾选时清空存储
  }
};

// 打开弹框
const openDialog = () => {
  dialogVisible.value = true;
};
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px;
  gap: 16px;
}
.mode-des {
  color: var(--tv-color-text-weaken);
  font-size: 12px;
  line-height: 18px;
}
</style>
