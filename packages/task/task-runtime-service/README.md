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

### 新增员工

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

### 删除员工

```js
// 删除员工
window.sendMessage({
  id: '123',
  instructions: [
    { action: 'vue_push', params: { to: '/vue-pro/userManager/allInfo' } },
    {
      action: 'input',
      params: { selector: '.ta-mark__search-input input', value: '岑子轩' },
    },
    {
      action: 'click',
      params: { selector: '.ta-mark__search-btn' },
    },
    {
      action: 'click',
      params: { selector: '.tiny-grid-body__row .operation-delete' },
    },
    {
      action: 'apiConfirmStart',
      params: {
        url: '/api/user/:id',
        method: 'DElETE',
      },
    },
    {
      action: 'userGuide',
      params: {
        selector: '.ta-mark__del-modal .tiny-button--primary',
        type: 'click',
        title: '高危操作',
        text: '请您确认是否删除该员工！',
      },
    },
    {
      action: 'apiConfirmEnd',
      params: {
        url: '/api/user/:id',
        method: 'DElETE',
      },
    },
  ],
});
```

### 查找员工

```js
window.sendMessage({
  id: '123',
  instructions: [
    { action: 'vue_push', params: { to: '/vue-pro/userManager/allInfo' } },
    // 条件为空，清空筛选
    {
      action: 'click',
      params: { selector: '.ta-mark__employee-id .tiny-grid-filter__btn' },
    },
    {
      action: 'click',
      params: {
        selector: '.filter__active .tiny-button--default',
      },
    },
    {
      action: 'click',
      params: {
        selector: '.filter__active .tiny-button--primary',
      },
    },
    // 条件不为空，输入对应筛选条件
    {
      action: 'click',
      params: { selector: '.ta-mark__employee-name .tiny-grid-filter__btn' },
    },
    {
      action: 'input',
      params: {
        selector: '.filter__active .filter-option__input input',
        value: '岑子轩',
      },
    },
    {
      action: 'click',
      params: {
        selector: '.filter__active .tiny-button--primary',
      },
    },
    {
      action: 'click',
      params: {
        selector: '.ta-mark__employee-department .tiny-grid-filter__btn',
      },
    },
    {
      action: 'input',
      params: {
        selector: '.filter__active .filter-option__input input',
        value: '用户体验部',
      },
    },
    {
      action: 'click',
      params: {
        selector: '.filter__active .tiny-button--primary',
      },
    },
    // 最后一步筛选添加接口监听
    {
      action: 'click',
      params: {
        selector: '.ta-mark__employee-email .tiny-grid-filter__btn',
      },
    },
    {
      action: 'click',
      params: {
        selector: '.filter__active .tiny-button--default',
      },
    },
    {
      action: 'apiConfirmStart',
      params: {
        url: '/api/user',
        method: 'GET',
        query: {
          page: '1',
        },
      },
    },
    {
      action: 'click',
      params: {
        selector: '.filter__active .tiny-button--primary',
      },
    },
    {
      action: 'apiConfirmEnd',
      params: {
        url: '/api/user',
        method: 'GET',
        query: {
          page: '1',
        },
      },
    },
  ],
});
```

### 更新员工

```js
// 删除员工
window.sendMessage({
  id: '123',
  instructions: [
    { action: 'vue_push', params: { to: '/vue-pro/userManager/allInfo' } },
    {
      action: 'input',
      params: { selector: '.ta-mark__search-input input', value: '岑子轩' },
    },
    {
      action: 'click',
      params: { selector: '.ta-mark__search-btn' },
    },
    {
      action: 'click',
      params: { selector: '.tiny-grid-body__row .operation-delete' },
    },
    {
      action: 'apiConfirmStart',
      params: {
        url: '/api/user/:id',
        method: 'DElETE',
      },
    },
    {
      action: 'userGuide',
      params: {
        selector: '.ta-mark__del-modal .tiny-button--primary',
        type: 'click',
        title: '高危操作',
        text: '请您确认是否删除该员工！',
      },
    },
    {
      action: 'apiConfirmEnd',
      params: {
        url: '/api/user/:id',
        method: 'DElETE',
      },
    },
  ],
});
```
