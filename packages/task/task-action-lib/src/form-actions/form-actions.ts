import { Action } from '@opentiny/tiny-agent-task-runtime-service/types';
import { findElement } from '../dom-actions/dom';
import {
  simulateCheckboxSelection,
  simulateRadioSelection,
  simulateSelectOption,
  simulateSubmitClick,
  simulateUserInput,
} from './form-simulate';
import { t } from '../locale/i18n';

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
  description: t('formActions.description.input'),
  execute: async (params, context) => {
    const { selector, timeout, value } = params;
    const element = await findElement(selector, timeout);
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      await simulateUserInput(element, value);
    } else {
      throw new Error(
        t('formActions.errorMsg.input', { element: element as any })
      );
    }

    return {
      status: 'success',
    };
  },
};

// radio Action
const radio: Action = {
  name: FormActionType.RADIO,
  description: t('formActions.description.radio'),
  execute: async (params, context) => {
    const { selector, timeout } = params;
    const element = await findElement(selector, timeout);
    if (element instanceof HTMLInputElement && element.type === 'radio') {
      await simulateRadioSelection(element);
    } else {
      throw new Error(
        t('formActions.errorMsg.radio', { element: element as any })
      );
    }
    return {
      status: 'success',
    };
  },
};

// checkbox Action
const checkbox: Action = {
  name: FormActionType.CHECKBOX,
  description: t('formActions.description.checkbox'),
  execute: async (params, context) => {
    const { selector, timeout, checked } = params;
    const element = await findElement(selector, timeout);
    if (element instanceof HTMLInputElement && element.type === 'checkbox') {
      await simulateCheckboxSelection(element, checked);
    } else {
      throw new Error(
        t('formActions.errorMsg.checkbox', { element: element as any })
      );
    }
    return {
      status: 'success',
    };
  },
};

// select Action
const select: Action = {
  name: FormActionType.SELECT,
  description: t('formActions.description.select'),
  execute: async (params, context) => {
    const { selector, timeout, value } = params;
    const element = await findElement(selector, timeout);
    if (element instanceof HTMLSelectElement) {
      await simulateSelectOption(element, value);
    } else {
      throw new Error(
        t('formActions.errorMsg.select', { element: element as any })
      );
    }
    return {
      status: 'success',
    };
  },
};

// submit Action
const submit: Action = {
  name: FormActionType.SUBMIT,
  description: t('formActions.description.submit'),
  execute: async (params, context) => {
    const { selector, timeout } = params;
    const element = await findElement(selector, timeout);
    if (element instanceof HTMLInputElement && element.type === 'submit') {
      await simulateSubmitClick(element);
    } else {
      throw new Error(
        t('formActions.errorMsg.submit', { element: element as any })
      );
    }
    return {
      status: 'success',
    };
  },
};

export const FormActions = [input, radio, checkbox, select, submit];
