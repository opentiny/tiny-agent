# Vue Router Actions

Vue 路由操作执行器，用于在 Vue 应用中进行路由跳转、后退、前进等操作

## Action 说明

### vueRouterPush

- **名称**：vueRouterPush
- **描述**：进行路由跳转操作
- **入参**：
  - params(object):
    - to(object): 要跳转的路由信息
  - context(object): 上下文信息，需包含 vueRouter 实例
- **出参**：
  - status(string): 执行结果状态，成功为 success，失败为 error
  - result(object): 成功时包含成功信息
  - error(object): 失败时包含错误信息

### vueRouterReplace

- **名称**：vueRouterReplace
- **描述**：进行路由替换操作
- **入参**：
  - params(object):
    - to(object): 要替换的路由信息
  - context(object): 上下文信息，需包含 vueRouter 实例
- **出参**：
  - status(string): 执行结果状态，成功为 success，失败为 error
  - result(object): 成功时包含成功信息
  - error(object): 失败时包含错误信息

### vueRouterGoBack

- **名称**：vueRouterGoBack
- **描述**：进行后退操作
- **入参**：
  - params(object): 无
  - context(object): 上下文信息，需包含 vueRouter 实例
- **出参**：
  - status(string): 执行结果状态，成功为 success，失败为 error
  - result(object): 成功时包含成功信息
  - error(object): 失败时包含错误信息

### vueRouterGoForward

- **名称**：vueRouterGoForward
- **描述**：进行前进操作
- **入参**：
  - params(object): 无
  - context(object): 上下文信息，需包含 vueRouter 实例
- **出参**：
  - status(string): 执行结果状态，成功为 success，失败为 error
  - result(object): 成功时包含成功信息
  - error(object): 失败时包含错误信息

### vueRouterGo

- **名称**：vueRouterGo
- **描述**：前进或后退指定步数操作
- **入参**：
  - params(object):
    - steps(number): 要前进或后退的步数
  - context(object): 上下文信息，需包含 vueRouter 实例
- **出参**：
  - status(string): 执行结果状态，成功为 success，失败为 error
  - result(object): 成功时包含成功信息
  - error(object): 失败时包含错误信息
