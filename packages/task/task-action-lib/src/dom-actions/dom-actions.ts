// dom_operation_lib.ts
import { Action } from '@opentiny/tiny-agent-task-runtime-service/types';
import { findElement, getElementByText } from './dom';
import { simulateClick } from './dom-simulate';
import { t } from '../locale/i18n';

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
  CLICK_BY_TEXT = 'clickByText',
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

const clickByText: Action = {
  name: ActionType.CLICK_BY_TEXT,
  execute: async (params, context) => {
    const { selector, timeout, text } = params;
    const element = await getElementByText(selector, text);
    if (!element) {
      return {
        status: 'error',
        error: { message: t('domActions.errorMsg.clickByText') },
      };
    }
    await simulateClick(element);
    return {
      status: 'success',
    };
  },
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

// TODO: 日期选择需要单独出来
const selectDate: Action = {
  name: 'selectDate',
  execute: async (params, context) => {
    const { selector, date } = params;
    const element = await findElement(selector, 10000);

    const dateArr = date.split('-');
    const year = Number(dateArr[0]);
    const month = Number(dateArr[1]);
    const day = Number(dateArr[2]);

    // 选择年份
    const yearSelect = element.querySelector('.tiny-date-picker__header-label');
    await simulateClick(yearSelect);
    const firstYear = Number(
      element.querySelector('.tiny-year-table td:first-child').innerText
    );
    const lastYear = Number(
      element.querySelector('.tiny-year-table tr:last-child td:last-child')
        .innerText
    );
    if (year <= lastYear && year >= firstYear) {
      const targetYear = await getElementByText(element, year.toString());

      await simulateClick(targetYear);
    } else if (year > lastYear) {
      const clickCount = Math.ceil((year - lastYear) / 12);
      const nextYear = element.querySelector('.tiny-date-picker__next-btn');
      for (let i = 0; i < clickCount; i++) {
        await simulateClick(nextYear);
      }
      const targetYear = await getElementByText(element, year.toString());
      await simulateClick(targetYear);
    } else if (year < firstYear) {
      const clickCount = Math.ceil((firstYear - year) / 12);
      const prevYear = element.querySelector('.tiny-date-picker__prev-btn');
      for (let i = 0; i < clickCount; i++) {
        await simulateClick(prevYear);
      }
      const targetYear = await getElementByText(element, year.toString());
      await simulateClick(targetYear);
    }

    // 选择月份
    const monthSelect = element.querySelectorAll('.tiny-month-table td')[
      month - 1
    ];
    await simulateClick(monthSelect);
    // 选择日期
    const daySelect = element.querySelectorAll('.tiny-date-table td.available')[
      day - 1
    ];
    await simulateClick(daySelect);

    return {
      status: 'success',
    };
  },
};

export const DomActions = [
  highlight,
  insertBefore,
  scrollTo,
  click,
  doubleClick,
  rightClick,
  goBack,
  goForward,
  findDom,
  clickByText,
  selectDate,
];
