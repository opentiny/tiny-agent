import domActions from '../dom-actions';
import formActions from '../form-actions';
import { ActionManager } from './actionManager';
import { executeActions } from './execute';

// 创建插件管理实例
const manager = new ActionManager();

// 批量注册ACTION
manager.registerActions([...domActions, ...formActions]);
console.log('插件列表：', manager.getActionList());

// 使用示例
const actionList = [
  {
    action: 'input',
    params: { selector: '#name', value: '六的哇哇哇' },
  },
  {
    action: 'input',
    params: { selector: '#password', value: 'huahua' },
  },
  {
    action: 'radio',
    params: { selector: '#female' },
  },
  {
    action: 'checkbox',
    params: { selector: '#subscribe', checked: false },
  },
  {
    action: 'select',
    params: { selector: '#country', value: 'usa' },
  },
  { action: 'click', params: { selector: '#submit' } },
];

executeActions(manager, actionList)
  .then((finalContext) => {
    console.log('最终结果:', finalContext);
  })
  .catch((error) => {
    console.error('链式执行出错:', error);
  });
