# Task

任务执行器，用于管理和执行一系列指令

- **用法**

```typescript
new Task(actionManager, context);
```

- **参数说明**
  - `actionManager(ActionManager)`: Action 管理器实例
  - `context(ISchedulerContext)`: 调度器上下文，包含任务执行所需的环境信息

## 方法

### execute

执行任务指令集

- **详细信息**

  执行传入的指令集，返回执行结果。

- **示例**

```typescript
const task = new Task(actionManager, context);
const result = await task.execute(instructions);
```

### pause

暂停任务执行

- **详细信息**

  暂停当前任务的执行，会立即改变执行状态，但是执行中的 Action 无法中断，实际情况会在当前 Action 执行完毕后暂停。

- **示例**

```typescript
const task = new Task(actionManager, context);
task.pause();
```

### resume

恢复任务执行

- **详细信息**

  恢复被暂停的任务执行。

- **示例**

```typescript
const task = new Task(actionManager, context);
task.resume();
```

### skip

跳过当前步骤

- **详细信息**

  跳过当前执行的步骤，继续执行下一步。

- **示例**

```typescript
const task = new Task(actionManager, context);
task.skip();
```

### stop

停止任务执行

- **详细信息**

  停止当前任务的执行，会立即改变状态，但会和 pause 一样，无法中断 Action，会在 Action 执行完毕后返回执行结果。

- **示例**

```typescript
const task = new Task(actionManager, context);
await task.stop();
```

### addCleanEffect

添加清理函数

- **详细信息**

  添加任务结束时需要执行的清理函数。

- **示例**

```typescript
const task = new Task(actionManager, context);
task.addCleanEffect(() => {
  // 清理操作
});
```

## 事件

### on('start')

- **示例**

```typescript
const task = new Task(actionManager, context);
task.on('start', () => {});
```

任务开始执行时触发

### on('pause')

- **示例**

```typescript
const task = new Task(actionManager, context);
task.on('pause', () => {});
```

任务暂停时触发

### on('resume')

任务恢复执行时触发

- **示例**

```typescript
const task = new Task(actionManager, context);
task.on('resume', () => {});
```

### on('finish')

任务完成时触发

- **示例**

```typescript
const task = new Task(actionManager, context);
task.on('finish', () => {});
```

### on('beforeStep')

执行每个步骤前触发，携带当前步骤索引和指令信息

- **示例**

```typescript
const task = new Task(actionManager, context);
task.on('beforeStep', (params) => {
  const { index, instruction } = params;
  console.log(index, instruction);
});
```

- **参数说明**
  - `params(object)`: 事件携带的入参
    - `index(number)`: 当前正要执行指令的下标，以 0 为起始
    - `instruction(IInstruction)`: 当前正要执行指令的信息
