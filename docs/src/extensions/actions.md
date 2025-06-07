
# 扩展思路

用户可以根据自己的需求创建自定义 `Action`。一个 `Action` 本质上是一个包含 `name` 和 `execute` 方法的对象。`name` 是 `Action` 的**唯一标识符**，`execute` 方法是 `Action` 的具体执行逻辑。

## 自定义 `Action` 示例

假设我们需要创建一个自定义 `Action` ，用于在页面上显示一个提示框。以下是实现步骤：

### 步骤 1：定义 `Action` 类型

```ts
enum CustomActionType {
  SHOW_ALERT = 'showAlert',
}
```

### 步骤 2：创建 `Action` 对象

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

### 步骤 3：注册自定义 `Action`

```ts
actionManager.registerActions([showAlert]);
```

### 步骤 4：使用自定义 `Action`

```ts
const instructions = [
  { name: 'showAlert', params: { message: 'This is a custom alert!' } },
];
const result = await task.execute(instructions);
```
