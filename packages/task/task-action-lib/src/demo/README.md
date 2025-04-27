## 使用方法
1. 引入所需的操作
```ts
import { DomActions } from './src';
import { FormActions } from './src';
import { VueRouterActions } from './src';
```
2. 创建 `ActionManager` 实例
```ts
import { ActionManager } from './src/demo/actionManager';

const manager = new ActionManager();
```
3. 注册操作
```ts
// 批量注册表单操作
manager.registerActions(FormActions);

// 批量注册 DOM 操作
manager.registerActions(DomActions);

// 批量注册 Vue Router 操作
manager.registerActions(VueRouterActions);
```
4. 执行操作
```ts
import { executeActions } from './src/demo/execute';

const actionList = [
  { action: 'input', params: { selector: '#input-field', timeout: 1000, value: 'Hello, World!' }, context: null },
  { action: 'select', params: { selector: '#select-field', timeout: 1000, value: 'option1' }, context: null },
  { action: 'submit', params: { selector: '#submit-button', timeout: 1000 }, context: null },
];

executeActions(manager, actionList)
  .then((finalContext) => {
    console.log('最终结果:', finalContext);
  })
  .catch((error) => {
    console.error('链式执行出错 :', error);
  });
```