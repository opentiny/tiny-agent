# `Actions` 概述

在我们的系统中，`Actions` 是执行特定任务的基本单元。它们涵盖了从表单操作、路由跳转、用户引导到 DOM 操作等多个方面，为用户提供了丰富的功能来自动化和模拟各种交互行为。

## `Actions` 分类

- **表单操作（Form Actions）**：处理表单元素的输入、选择和提交等操作，如输入文本、选择单选框、复选框和下拉列表等。
- **路由操作（Vue Router Actions）**：用于在 Vue 应用中进行路由跳转、后退、前进等操作。
- **用户引导操作（User Guide Actions）**：显示用户引导模态框，帮助用户了解特定操作。
- **DOM 与 BOM 操作（Base Actions）**：对页面上的 DOM 元素或浏览器界面进行各种操作，如点击、高亮、路由(前进、后退)等。
- **组件库操作(TinyVue Actions)**: 对使用了[TinyVue 组件库](https://opentiny.design/tiny-vue/zh-CN/os-theme/overview)项目，模拟其日期操作，待后续丰富其他操作。

## `Actions` 的使用方法

### 引入和注册 `Actions`

首先，需要引入所需的 `Action` 模块，并将其注册到 `Action` 中。以下是一个示例：

```ts
import { ActionManager } from '@opentiny/tiny-agent-task-runtime-service';
import {
  FormActions,
  VueRouterActions,
  GuideActions,
  DomActions,
} from '@opentiny/tiny-agent-task-action-lib';

const actionManager = new ActionManager();
actionManager.registerActions([
  ...FormActions,
  ...VueRouterActions,
  ...GuideActions,
  ...DomActions,
]);
```

### 创建任务并执行 `Actions`

创建一个 [Task](/api/schedular/task) 实例，并使用 [execute](/api/schedular/task#execute) 方法执行指令集。指令集中的每个指令对应一个 `Action` 。

```ts
const task = new Task(actionManager, context);
const instructions = [
  { name: 'input', params: { selector: '#input-field', value: 'Hello World' } },
  { name: 'vueRouterPush', params: { to: { name: 'Home' } } },
];
const result = await task.execute(instructions);
```

## 自定义 `Action` 扩展

### 扩展思路

用户可以根据自己的需求创建自定义 `Action`。一个 `Action` 本质上是一个包含 `name` 和 `execute` 方法的对象。`name` 是 `Action` 的**唯一标识符**，`execute` 方法是 `Action` 的具体执行逻辑。

### 自定义 `Action` 示例

假设我们需要创建一个自定义 `Action` ，用于在页面上显示一个提示框。以下是实现步骤：

#### 步骤 1：定义 `Action` 类型

```ts
enum CustomActionType {
  SHOW_ALERT = 'showAlert',
}
```

#### 步骤 2：创建 `Action` 对象

```ts
import { Action } from '@opentiny/tiny-agent-task-runtime-service/types';

const showAlert: Action = {
  name: CustomActionType.SHOW_ALERT,
  execute: async (params, context) => {
    const { message } = params;
    alert(message);
    return {
      status: 'success',
    };
  },
};
```

#### 步骤 3：注册自定义 `Action`

```ts
actionManager.registerActions([showAlert]);
```

#### 步骤 4：使用自定义 `Action`

```ts
const instructions = [
  { name: 'showAlert', params: { message: 'This is a custom alert!' } },
];
const result = await task.execute(instructions);
```
