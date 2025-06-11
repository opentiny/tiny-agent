// dom_operation_lib.ts
import type { IAction } from '@opentiny/tiny-agent-task-runtime-service';
import { findElement, getElementByText, simulateClick } from '../base-actions';
import { t } from '../locale/i18n';

// 元素操作
enum DomActionType {
  HIGHLIGHT = 'highlight',
  INSERT_BEFORE = 'insertBefore',
  SCROLL_TO = 'scrollTo',
  CLICK = 'click',
  DOUBLE_CLICK = 'doubleClick',
  RIGHT_CLICK = 'rightClick',
  CLICK_BY_TEXT = 'clickByText',
}

// dom 扫描
enum ScanDomActionType {
  FIND_DOM = 'findDom',
}

// 定义操作类型的枚举
const ActionType = {
  ...DomActionType,
  ...ScanDomActionType,
};

const clickByText: IAction = {
  name: ActionType.CLICK_BY_TEXT,
  execute: async (params: { selector: string; timeout?: number; text: string }) => {
    const { selector, timeout, text } = params;
    const element = await getElementByText(selector, text, timeout);
    if (!element) {
      return {
        status: 'error',
        error: { message: t('domActions.errorMsg.clickByText') },
      };
    }
    await simulateClick(element as HTMLElement);
    return {
      status: 'success',
    };
  },
};

// 高亮插件
const highlight: IAction = {
  name: ActionType.HIGHLIGHT,
  execute: async (params: { selector: string; timeout?: number }) => {
    const element = await findElement(params.selector, params.timeout);
    element.style.outline = '2px solid red';
    return {
      status: 'success',
    };
  },
};

// 插入前置元素插件
const insertBefore: IAction = {
  name: ActionType.INSERT_BEFORE,
  execute: async (params: { content: string; selector: string; timeout?: number }) => {
    if (!params.content) {
      throw new Error(t('domActions.errorMsg.insertBefore'));
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
const scrollTo: IAction = {
  name: ActionType.SCROLL_TO,
  execute: async (params: { selector: string; timeout?: number }) => {
    const element = await findElement(params.selector, params.timeout);
    element.scrollIntoView({ behavior: 'smooth' });
    return {
      status: 'success',
    };
  },
};

// 点击插件
const click: IAction = {
  name: ActionType.CLICK,
  execute: async (params: { selector: string; timeout?: number }) => {
    const element = await findElement(params.selector, params.timeout);
    await simulateClick(element);
    return {
      status: 'success',
    };
  },
};

// 双击插件
const doubleClick: IAction = {
  name: ActionType.DOUBLE_CLICK,
  execute: async (params: { selector: string; timeout: number }) => {
    const element = await findElement(params.selector, params.timeout);
    const event = new Event('dblclick');
    element.dispatchEvent(event);
    return {
      status: 'success',
    };
  },
};

// 右键点击插件
const rightClick: IAction = {
  name: ActionType.RIGHT_CLICK,
  execute: async (params: { selector: string; timeout?: number }) => {
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

// 查找 DOM 元素插件
const findDom: IAction = {
  name: ActionType.FIND_DOM,
  execute: async (params: { selector: string; timeout?: number }) => {
    const element = await findElement(params.selector, params.timeout);
    const domArr: string[] = [];
    domArr.push(element.outerHTML);

    return {
      status: 'success',
      result: { dom: domArr },
    };
  },
};

export const DomActions = [highlight, insertBefore, scrollTo, click, doubleClick, rightClick, findDom, clickByText];
