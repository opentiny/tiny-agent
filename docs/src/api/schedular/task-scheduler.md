# TaskScheduler

任务调度器，用于管理和执行多个任务

- **用法**

```typescript
new TaskScheduler(actionManager, context?);
```

- **参数说明**

  - `actionManager(ActionManager)`: ActionManager 实例
  - `context(ISchedulerContext)` [可选]: 调度器上下文，包含任务执行所需的环境信息

- **示例**

```typescript
const actionManager = new ActionManager();
const scheduler = new TaskScheduler(actionManager, {});
```

## 方法

### pushTask

添加任务到队列

- **详细信息**

  将新任务添加到执行队列中，并返回任务执行结果的 Promise。

- **示例**

```typescript
const result = await scheduler.pushTask({
  id: 'task1',
  instructions: [{ action: 'click', params: { selector: '.target-btn' } }],
});
```

### addContext

添加上下文信息

- **详细信息**

  向调度器添加上下文信息，这些信息将用于任务执行。

- **示例**

```typescript
scheduler.addContext({
  // 上下文信息
});
```

### connectTaskUI

连接任务调度器界面

- **详细信息**

  将任务界面与当前任务关联，实现界面与任务的交互。

- **示例**

```typescript
const scheduler = new TaskScheduler(actionManager, context);
const taskUI = new TaskUI();
scheduler.connectTaskUI(taskUI);
```
