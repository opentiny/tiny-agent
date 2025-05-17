# tiny-agent 运行时服务层

## 核心概念

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
    { "action": "vue_push", "params": { "url": "/addPath" } },
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

## 基本用法

```js
import { createScheduler } from '@opentiny/tiny-agent-task-runtime-service';
import {
  DomActions,
  FormActions,
  VueRouterActions,
  GuideActions,
  AxiosActions,
} from '@opentiny/tiny-agent-task-action-lib';

const baseActions = [...DomActions, ...FormActions];
const initContext = {
  $router: router,
};

const { taskScheduler, actionManager } = createScheduler(
  baseActions,
  initContext
);

// 通过actionManager动态新增action
const extendActions = [...VueRouterActions, ...GuideActions, ...AxiosActions];
actionManager.registerActions(extendActions);

// 动态添加上下文
taskScheduler.addContext({ $axiosConfig: { axios, timeout: 3000 } });

const taskDescription = {
  id: '123',
  instructions: [{ action: 'click', params: { selector: '#submitBtn' } }],
};
taskScheduler.pushTask(taskDescription);
```
