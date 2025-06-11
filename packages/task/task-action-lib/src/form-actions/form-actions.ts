import type { IAction } from '@opentiny/tiny-agent-task-runtime-service';
import { findElement } from '../base-actions';
import { t } from '../locale/i18n';
import {
  simulateCheckboxSelection,
  simulateRadioSelection,
  simulateSelectOption,
  simulateSubmitClick,
  simulateUserInput,
} from './form-simulate';

// 元素操作
enum FormActionType {
  INPUT = 'input',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  SELECT = 'select',
  SUBMIT = 'submit',
}

// input Action
const input: IAction = {
  name: FormActionType.INPUT,
  description: t('formActions.description.input'),
  execute: async (params: { selector: string; timeout?: number; value: any }) => {
    const { selector, timeout, value } = params;
    const element = await findElement(selector, timeout);
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      await simulateUserInput(element, value);
    } else {
      throw new Error(t('formActions.errorMsg.input', { element: element as any }));
    }

    return {
      status: 'success',
    };
  },
} as IAction;

// radio Action
const radio: IAction = {
  name: FormActionType.RADIO,
  description: t('formActions.description.radio'),
  execute: async (params: { selector: string; timeout?: number }) => {
    const { selector, timeout } = params;
    const element = await findElement(selector, timeout);
    if (element instanceof HTMLInputElement && element.type === 'radio') {
      await simulateRadioSelection(element);
    } else {
      throw new Error(t('formActions.errorMsg.radio', { element: element as any }));
    }
    return {
      status: 'success',
    };
  },
} as IAction;

// checkbox Action
const checkbox: IAction = {
  name: FormActionType.CHECKBOX,
  description: t('formActions.description.checkbox'),
  execute: async (params: { selector: string; timeout?: number; checked: any }) => {
    const { selector, timeout, checked } = params;
    const element = await findElement(selector, timeout);
    if (element instanceof HTMLInputElement && element.type === 'checkbox') {
      await simulateCheckboxSelection(element, checked);
    } else {
      throw new Error(t('formActions.errorMsg.checkbox', { element: element as any }));
    }
    return {
      status: 'success',
    };
  },
} as IAction;

// select Action
const select: IAction = {
  name: FormActionType.SELECT,
  description: t('formActions.description.select'),
  execute: async (params: { selector: string; timeout?: number; value: any }) => {
    const { selector, timeout, value } = params;
    const element = await findElement(selector, timeout);
    if (element instanceof HTMLSelectElement) {
      await simulateSelectOption(element, value);
    } else {
      throw new Error(t('formActions.errorMsg.select', { element: element as any }));
    }
    return {
      status: 'success',
    };
  },
} as IAction;

// submit Action
const submit: IAction = {
  name: FormActionType.SUBMIT,
  description: t('formActions.description.submit'),
  execute: async (params: { selector: string; timeout?: number }) => {
    const { selector, timeout } = params;
    const element = await findElement(selector, timeout);
    if (element instanceof HTMLInputElement && element.type === 'submit') {
      await simulateSubmitClick(element);
    } else {
      throw new Error(t('formActions.errorMsg.submit', { element: element as any }));
    }
    return {
      status: 'success',
    };
  },
} as IAction;

export const FormActions = [input, radio, checkbox, select, submit];
