// dom_operation_lib.ts
import { Action } from '../common/action.d';
import { findElement } from '../common';
import { simulateClick } from './dom-simulate';

// 历史堆栈操作
enum StackActionType {
  GO_BACK = 'goBack',
  GO_FORWARD = 'goForward',
}

// 元素操作
enum DomActionType {
  HIGHLIGHT = 'highlight',
  INSERT_BEFORE = 'insertBefore',
  SCROLL_TO = 'scrollTo',
  CLICK = 'click',
  DOUBLE_CLICK = 'doubleClick',
  RIGHT_CLICK = 'rightClick',
}

// dom 扫描
enum ScanDomActionType {
  FIND_DOM = 'findDom',
}

// 定义操作类型的枚举
const ActionType = {
  ...StackActionType,
  ...DomActionType,
  ...ScanDomActionType,
};

// 高亮插件
const highlight: Action = {
  name: ActionType.HIGHLIGHT,
  execute: async (params, context) => {
    const element = await findElement(params.selector, params.timeout);
    element.style.outline = '2px solid red';
    return {
      status: 'success',
    };
  },
};

// 插入前置元素插件
const insertBefore: Action = {
  name: ActionType.INSERT_BEFORE,
  execute: async (params, context) => {
    if (!params.content) {
      throw new Error('执行 insertBefore 操作时缺少 content 参数');
    }
    const element = await findElement(params.selector, params.timeout);
    const newElement = document.createElement('div');
    newElement.innerHTML = params.content as string;
    if (element.parentNode) {
      element.parentNode.insertBefore(newElement, element);
    }
    return {
      status: 'success',
    };
  },
};

// 滚动到元素插件
const scrollTo: Action = {
  name: ActionType.SCROLL_TO,
  execute: async (params, context) => {
    const element = await findElement(params.selector, params.timeout);
    element.scrollIntoView({ behavior: 'smooth' });
    return {
      status: 'success',
    };
  },
};

// 点击插件
const click: Action = {
  name: ActionType.CLICK,
  execute: async (params, context) => {
    const element = await findElement(params.selector, params.timeout);
    await simulateClick(element);
    return {
      status: 'success',
    };
  },
};

// 双击插件
const doubleClick: Action = {
  name: ActionType.DOUBLE_CLICK,
  execute: async (params, context) => {
    const element = await findElement(params.selector, params.timeout);
    const event = new Event('dblclick');
    element.dispatchEvent(event);
    return {
      status: 'success',
      result: context.result,
    };
  },
};

// 右键点击插件
const rightClick: Action = {
  name: ActionType.RIGHT_CLICK,
  execute: async (params, context) => {
    const element = await findElement(params.selector, params.timeout);
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    element.dispatchEvent(event);

    return {
      status: 'success',
    };
  },
};

// 后退插件
const goBack: Action = {
  name: ActionType.GO_BACK,
  execute: (params, context) => {
    window.history.back();
    return {
      status: 'success',
    };
  },
};

// 前进插件
const goForward: Action = {
  name: ActionType.GO_FORWARD,
  execute: (params, context) => {
    window.history.forward();
    return {
      status: 'success',
    };
  },
};

// 查找 DOM 元素插件
const findDom: Action = {
  name: ActionType.FIND_DOM,
  execute: async (params, context) => {
    const element = await findElement(params.selector, params.timeout);
    const domArr: string[] = [];
    domArr.push(element.outerHTML);

    return {
      status: 'success',
      result: { dom: domArr },
    };
  },
};

export default [
  highlight,
  insertBefore,
  scrollTo,
  click,
  doubleClick,
  rightClick,
  goBack,
  goForward,
  findDom,
];
