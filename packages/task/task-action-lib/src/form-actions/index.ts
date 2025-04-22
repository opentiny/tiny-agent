import { Action } from '../common/action.d';
import { findElement } from '../common';
import {
  simulateCheckboxSelection,
  simulateRadioSelection,
  simulateSelectOption,
  simulateSubmitClick,
  simulateUserInput,
} from './form_simulate';

// 元素操作
enum FormActionType {
  INPUT = 'input',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  SELECT = 'select',
  SUBMIT = 'submit',
}

// input Action
const input: Action = {
  name: FormActionType.INPUT,
  description: '模拟用户输入',
  execute: async (params, context) => {
    const { selector, timeout, value } = params;
    const element = await findElement(selector, timeout);
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      await simulateUserInput(element, value);
    } else {
      throw new Error('元素不是有效的输入或文本区域元素:' + element);
    }

    return {
      status: 'success',
    };
  },
};

// radio Action
const radio: Action = {
  name: FormActionType.RADIO,
  description: '模拟用户选择单选按钮',
  execute: async (params, context) => {
    const { selector, timeout } = params;
    const element = await findElement(selector, timeout);
    if (element instanceof HTMLInputElement && element.type === 'radio') {
      await simulateRadioSelection(element);
    } else {
      throw new Error('元素不是有效的单选按钮元素:' + element);
    }
    return {
      status: 'success',
    };
  },
};

// checkbox Action
const checkbox: Action = {
  name: FormActionType.CHECKBOX,
  description: '模拟用户选择复选框',
  execute: async (params, context) => {
    const { selector, timeout, checked } = params;
    const element = await findElement(selector, timeout);
    if (element instanceof HTMLInputElement && element.type === 'checkbox') {
      await simulateCheckboxSelection(element, checked);
    } else {
      throw new Error('元素不是有效的复选框元素:' + element);
    }
    return {
      status: 'success',
    };
  },
};

// select Action
const select: Action = {
  name: FormActionType.SELECT,
  description: '模拟用户选择下拉列表选项',
  execute: async (params, context) => {
    const { selector, timeout, value } = params;
    const element = await findElement(selector, timeout);
    if (element instanceof HTMLSelectElement) {
      await simulateSelectOption(element, value);
    } else {
      throw new Error('元素不是有效的下拉列表元素:' + element);
    }
    return {
      status: 'success',
    };
  },
};

// submit Action
const submit: Action = {
  name: FormActionType.SUBMIT,
  description: '模拟用户点击提交按钮',
  execute: async (params, context) => {
    const { selector, timeout } = params;
    const element = await findElement(selector, timeout);
    if (element instanceof HTMLInputElement && element.type === 'submit') {
      await simulateSubmitClick(element);
    } else {
      throw new Error('元素不是有效的提交按钮元素:' + element);
    }
    return {
      status: 'success',
    };
  },
};

export default [input, radio, checkbox, select, submit];
