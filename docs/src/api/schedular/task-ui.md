# TaskUI

任务执行器的用户界面组件，提供任务执行状态的可视化展示和控制

- **用法**

```typescript
new TaskUI({ title: string });
```

- **参数说明**
  - `title(string)`: 任务标题

## 方法

### show

显示任务调度器界面

- **示例**

```typescript
taskUI.show();
```

### hide

隐藏任务调度器界面

- **示例**

```typescript
taskUI.hide();
```

### setTitle

设置任务标题

- **用法**

```typescript
taskUI.setTitle(title: string);
```

- **详细信息**

  更新任务界面显示的标题。

- **示例**

```typescript
taskUI.setTitle('新的任务标题');
```

- **参数说明**
  - `title(string)`: 显示的标题

### pause

- **用法**

```typescript
taskUI.setTitle(isEmit: boolean);
```

暂停任务

- **详细信息**

调度器界面状态变为暂停，相应的 UI 也会改变，当通过点击 UI 界面暂停时，`isEmit`为`true`， 会触发相应的回调事件。

- **示例**

```typescript
taskUI.pause();
```

- **参数说明**
  - `isEmit(boolean)`: 是否触发相应的回调事件

### resume

恢复任务

- **详细信息**

  恢复被暂停的任务执行，并更新界面状态。

- **示例**

```typescript
const taskUI = new TaskUI({ title: '任务标题' });
taskUI.resume();
```

- **参数说明**
  - `isEmit(boolean)`: 是否触发相应的回调事件

### skip

跳过当前步骤

- **详细信息**

  跳过当前执行的步骤，继续执行下一步。

- **示例**

```typescript
const taskUI = new TaskUI({ title: '任务标题' });
taskUI.skip();
```

- **参数说明**
  - `isEmit(boolean)`: 是否触发相应的回调事件

### stop

停止任务

- **详细信息**

  停止当前任务的执行，并隐藏界面。

- **示例**

```typescript
const taskUI = new TaskUI({ title: '任务标题' });
taskUI.stop();
```

- **参数说明**
  - `isEmit(boolean)`: 是否触发相应的回调事件

### destroy

销毁界面

- **详细信息**

  销毁任务界面，清理所有 DOM 元素和事件监听。

- **示例**

```typescript
const taskUI = new TaskUI({ title: '任务标题' });
taskUI.destroy();
```

### tipToResume

显示恢复提示

- **详细信息**

  在恢复按钮上显示提示信息，鼠标悬停到恢复按钮时，会显示对应提示。

- **示例**

```typescript
taskUI.tipToResume('点击继续执行');
```

## 事件

### on('pause')

任务暂停时触发

- **示例**

```typescript
taskUI.on('pause', () => {});
```

### on('resume')

任务恢复执行时触发

- **示例**

```typescript
taskUI.on('resume', () => {});
```

### on('skip')

跳过步骤时触发

- **示例**

```typescript
taskUI.on('skip', () => {});
```

### on('stop')

任务停止时触发

- **示例**

```typescript
taskUI.on('stop', () => {});
```
