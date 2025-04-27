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
// 新增员工场景测试instructions
window.sendMessage({
  id: '123',
  instructions: [
    { action: 'vue_push', params: { to: '/vue-pro/userManager/allInfo' } },
    {
      action: 'click',
      params: {
        selector: '.user-add-btn > button',
      },
    },
    {
      action: 'input',
      params: {
        selector: '.ta-mark__user-add-modal .ta-mark__name-input input',
        value: '岑子轩',
      },
    },
    {
      action: 'click',
      params: {
        selector: '.ta-mark__user-add-modal .ta-mark__sex-select input',
      },
    },
    {
      action: 'clickByText',
      params: {
        selector: '.ta-mark__sex-select-panel',
        text: '男',
      },
    },
    {
      action: 'click',
      params: {
        selector: '.ta-mark__user-add-modal .ta-mark__department-select input',
      },
    },
    {
      action: 'clickByText',
      params: {
        selector: '.ta-mark__department-select-panel',
        text: '用户体验部',
      },
    },
    {
      action: 'click',
      params: {
        selector:
          '.ta-mark__user-add-modal .ta-mark__protocol-start-select input',
      },
    },
    {
      action: 'selectDate',
      params: {
        selector: '.ta-mark__protocol-start-select-panel',
        date: '2015-04-15',
      },
    },
    {
      action: 'input',
      params: {
        selector: '.ta-mark__user-add-modal .ta-mark__email-input input',
        value: 'cenzixuan@test.com',
      },
    },
    {
      action: 'apiConfirmStart',
      params: {
        url: '/api/user/reg',
      },
    },
    {
      action: 'userGuide',
      params: {
        selector: '.ta-mark__user-add-modal .general-btn > button',
        type: 'click',
        title: '高危操作',
        text: '请自行提交新增员工操作！',
      },
    },
    {
      action: 'apiConfirmEnd',
      params: {
        url: '/api/user/reg',
      },
    },
  ],
});
```

```js
// 删除员工
```
