# ActionManager

Action 管理器，用于管理和执行各种 Action

- **用法**

```typescript
new ActionManager();
```

## 方法

### registerAction

注册单个 Action

- **示例**

```typescript
const actionManager = new ActionManager();
actionManager.registerAction({
  name: 'custom-action',
  execute: async (params, context) => {
    // Action执行逻辑
  },
});
```

### registerActions

批量注册 Action

- **示例**

```typescript
const actionManager = new ActionManager();
actionManager.registerActions([
  {
    name: 'custom-action1',
    execute: async (params, context) => {
      // Action1执行逻辑
    },
  },
  {
    name: 'custom-action2',
    execute: async (params, context) => {
      // Action2执行逻辑
    },
  },
]);
```

### unregisterAction

注销单个 Action

- **详细信息**

  从管理器中注销指定的 Action。

- **示例**

```typescript
const actionManager = new ActionManager();
actionManager.unregisterAction('action1');
```

### unregisterActions

批量注销 Action

- **详细信息**

  从管理器中批量注销多个 Action。

- **示例**

```typescript
const actionManager = new ActionManager();
actionManager.unregisterActions(['action1', 'action2']);
```

### clearActions

清空所有 Action

- **详细信息**

  清空管理器中注册的所有 Action。

- **示例**

```typescript
const actionManager = new ActionManager();
actionManager.clearActions();
```

### getActionList

获取 Action 列表

- **详细信息**

  获取管理器中所有已注册的 Action 列表。

- **示例**

```typescript
const actionManager = new ActionManager();
const actions = actionManager.getActionList();
```

### overrideAction

覆盖 Action

- **详细信息**

  覆盖已存在的 Action 定义。

- **示例**

```typescript
const actionManager = new ActionManager();
actionManager.overrideAction({
  name: 'action1',
  execute: async (params, context) => {
    // 新的Action执行逻辑
  },
});
```

### findAction

查找 Action

- **详细信息**

  根据 Action 名称查找对应的 Action 定义。

- **示例**

```typescript
const actionManager = new ActionManager();
const action = actionManager.findAction('action1');
```
