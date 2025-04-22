### Action

用于执行相关页面操作的逻辑函数。

```ts
const click: Action = {
  name: ActionType.CLICK,
  execute: async (params, context) => {
    const elements = await findElements(params.selector, params.timeout);
    await forEachElement(elements, async (element) => {
      await simulateClick(element);
    });
    return {
      status: 'success',
    };
  },
};
```

### Instruction

指导页面进行相关操作的单条指令。

```json
{ "action": "click", "params": { "selector": "#submitBtn" } }
```

### Task

一个带有 ID 的指令集。

```json
{
  "id": "{{uniqueId}}",
  "instructions": [
    { "action": "jump", "params": { "url": "/addPath" } },
    { "action": "click", "params": { "selector": "#submitBtn" } }
  ]
}
// 跳转示例
{
  "id": "123",
  "instructions": [
    { "action": "vue_push", "params": { "to": "/vue-pro/userManager/allInfo" } },
    { "action": "click", "params": { "selector": ".user-add-btn > button" } }
  ]
}

```

```js
// 填写表单示例
window.sendMessage({
  id: '123',
  instructions: [
    { action: 'vue_push', params: { to: '/vue-pro/userManager/allInfo' } },
    {
      action: 'userGuide',
      params: {
        selector: '.user-add-btn > button',
        title: '提示',
        text: '请先点击添加员工！',
      },
    },
    {
      action: 'input',
      params: {
        selector:
          '.tiny-modal.active .tiny-form div:nth-child(1) div:nth-child(1) .tiny-form-item input',
        value: '岑子轩',
      },
    },
    {
      action: 'click',
      params: {
        selector:
          '.tiny-modal.active .tiny-form div:nth-child(1) div:nth-child(2) .tiny-form-item input',
      },
    },
    {
      action: 'click',
      params: {
        selector:
          'body > div.tiny-select-dropdown.tiny-popper > div > div.tiny-select-dropdown__wrap.tiny-scrollbar__wrap > ul > li:nth-child(1) > div > span',
      },
    },
    {
      action: 'click',
      params: {
        selector:
          '.tiny-modal.active .tiny-form div:nth-child(2) div:nth-child(1) .tiny-form-item input',
      },
    },
    {
      action: 'click',
      params: {
        selector:
          'body  .tiny-select-dropdown:not([style*="display: none"])  div.tiny-select-dropdown__wrap.tiny-scrollbar__wrap > ul > li:nth-child(1) > div > span',
      },
    },
    {
      action: 'click',
      params: {
        selector:
          '.tiny-modal.active .tiny-form div:nth-child(2) div:nth-child(2) .tiny-form-item input',
      },
    },
    {
      action: 'click',
      params: {
        selector:
          'body > div.tiny-picker-panel.tiny-date-picker.tiny-popper > div.tiny-picker-panel__body-wrapper > div > div.tiny-picker-panel__content > table > tbody > tr:nth-child(3) > td:nth-child(5) > div > span',
      },
    },
    {
      action: 'input',
      params: {
        selector:
          '.tiny-modal.active .tiny-form div:nth-child(3) div:nth-child(1) .tiny-form-item input',
        value: 'cenzixuan@test.com',
      },
    },
    {
      action: 'userGuide',
      params: {
        selector: '.tiny-modal.active .general-btn > button',
        title: '高危操作',
        text: '请自行提交新增员工操作！',
      },
    },
  ],
});
```
