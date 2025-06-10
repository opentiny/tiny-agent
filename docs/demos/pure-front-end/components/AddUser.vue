<template>
  <div class="user-form">
    <tiny-form label-width="100px">
      <tiny-form-item label="姓名">
        <tiny-input v-model="userInfo.name" class="user-input"></tiny-input>
      </tiny-form-item>
      <tiny-form-item label="性别">
        <tiny-select
          v-model="userInfo.sex"
          class="user-sex"
          popper-class="user-sex-popper"
        >
          <tiny-option label="男" value="男"></tiny-option>
          <tiny-option label="女" value="女"></tiny-option>
        </tiny-select>
      </tiny-form-item>
      <tiny-form-item label="出生日期">
        <tiny-date-picker
          v-model="userInfo.date"
          class="user-date"
          popper-class="user-date-popper"
        ></tiny-date-picker>
      </tiny-form-item>
      <tiny-form-item>
        <div class="btn-container">
          <tiny-button type="primary" @click="submitClick" class="user-submit">
            提交
          </tiny-button>
        </div>
      </tiny-form-item>
    </tiny-form>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { z } from 'zod';
import { useMcpService } from '@opentiny/tiny-agent-mcp-service-vue';
import {
  TinyForm,
  TinyFormItem,
  TinyDatePicker,
  TinyInput,
  TinyButton,
  TinyModal,
  TinySelect,
  TinyOption,
} from '@opentiny/vue';

const userInfo = reactive({
  name: '',
  date: '',
  sex: '',
});

function submitClick() {
  TinyModal.alert(
    `新增用户:${userInfo.name}，性别:${userInfo.sex}，出生日期:${userInfo.date}`
  );
}

function addUser({ name, sex, date }) {
  userInfo.name = name;
  userInfo.sex = sex;
  userInfo.date = date;
  submitClick();
}

const { tool } = useMcpService();

// 注册一个 MCP 工具
tool(
  'addUser',
  '新增用户',
  {
    name: z.string().describe('姓名'),
    sex: z.string().describe('性别'),
    date: z.string().describe('出生日期'),
  },
  async ({ name, sex, date }) => {
    addUser({ name, sex, date });
    return {
      content: [
        {
          type: 'text',
          text: `新增用户:${name} 成功`,
        },
      ],
    };
  }
);
</script>

<style scoped>
.user-form {
  width: 380px;
  position: static;
  margin: 30px auto;
}
.btn-container {
  text-align: center;
}
</style>
