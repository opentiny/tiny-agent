import domActions from '../dom-actions';
import formActions from '../form-actions';
import userGuideActions from '../user-guide-actions';
import { ActionManager } from './actionManager';
import { executeActions } from './execute';

// 创建插件管理实例
const manager = new ActionManager();

// 批量注册ACTION
manager.registerActions([...userGuideActions, ...domActions, ...formActions]);
console.log('插件列表：', manager.getActionList());

const guideContext: any = {};

// 使用示例
const actionList = [
  {
    action: 'userGuide',
    params: {
      selector: '#dangerous-button',
      title: '危险操作',
      text: '请谨慎操作！',
    },
    context: guideContext,
  },
  {
    action: 'input',
    params: { selector: '#name', value: '六的哇哇哇' },
  },
  {
    action: 'input',
    params: { selector: '#password', value: 'huahua' },
  },
];

executeActions(manager, actionList)
  .then((finalContext) => {
    console.log('最终结果:', finalContext);
  })
  .catch((error) => {
    console.error('链式执行出错:', error);
  });

const nextBtn = document.querySelector('#next-button') as HTMLButtonElement;
nextBtn.addEventListener('click', () => {
  guideContext?.resolve(); // 手动控制完成当前action操作
});
