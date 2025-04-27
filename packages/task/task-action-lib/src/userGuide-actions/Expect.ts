import { findElement } from '../common';
import { ActionExecute } from '../common/action';

export const executeExpect: ActionExecute = async (params, context) => {
  const {
    selector,
    timeout,

    toPassCode, // 用户传入的代码字符串
    codeParams, // 传递给代码的参数
    
    toBeAttached,
    toBeChecked,
    toBeDisabled,
    toBeEditable,
    toBeEmpty,
    toBeEnabled,
    toBeFocused,
    toBeHidden,
    toBeInViewport,
    toBeOK,
    toBeVisible,
    toContainClass,
    toContainText,
    toHaveAccessibleDescription,
    toHaveAccessibleErrorMessage,
    toHaveAccessibleName,
    toHaveAttribute,
    toHaveCSS,
    toHaveClass,
    toHaveCount,
    toHaveId,
    toHaveJSProperty,
    toHaveRole,
    toHaveText,
    toHaveTitle,
    toHaveURL,
    toHaveValue,
    toHaveValues,
  } = params;

  let element: HTMLElement | null = null;
  if (selector) {
    element = await findElement(selector, timeout);
  }

  if (toBeAttached !== undefined) {
    const isAttached = document.body.contains(element);
    if (toBeAttached !== isAttached) {
      throw new Error(
        `期望元素 ${selector} ${
          toBeAttached ? '已附加' : '未附加'
        } 到文档中，但实际状态相反`
      );
    }
  }

  if (
    toBeChecked !== undefined &&
    element instanceof HTMLInputElement &&
    element.type === 'checkbox'
  ) {
    if (toBeChecked !== element.checked) {
      throw new Error(
        `期望复选框 ${selector} ${
          toBeChecked ? '被选中' : '未被选中'
        }，但实际状态相反`
      );
    }
  }

  if (toBeDisabled !== undefined) {
    if (toBeDisabled !== (element as any).disabled) {
      throw new Error(
        `期望元素 ${selector} ${
          toBeDisabled ? '被禁用' : '未被禁用'
        }，但实际状态相反`
      );
    }
  }

  if (toBeEditable !== undefined) {
    const isEditable =
      element && !element.hasAttribute('readonly') && !(element as any).disabled;
    if (toBeEditable !== isEditable) {
      throw new Error(
        `期望元素 ${selector} ${
          toBeEditable ? '可编辑' : '不可编辑'
        }，但实际状态相反`
      );
    }
  }

  if (toBeEmpty !== undefined) {
    const isEmpty = element && element.textContent?.trim() === '';
    if (toBeEmpty !== isEmpty) {
      throw new Error(
        `期望元素 ${selector} ${toBeEmpty ? '为空' : '不为空'}，但实际状态相反`
      );
    }
  }

  if (toBeEnabled !== undefined) {
    if (toBeEnabled !== !(element as any)?.disabled) {
      throw new Error(
        `期望元素 ${selector} ${toBeEnabled ? '启用' : '禁用'}，但实际状态相反`
      );
    }
  }

  if (toBeFocused !== undefined) {
    const isFocused = element === document.activeElement;
    if (toBeFocused !== isFocused) {
      throw new Error(
        `期望元素 ${selector} ${
          toBeFocused ? '获得焦点' : '失去焦点'
        }，但实际状态相反`
      );
    }
  }

  if (toBeHidden !== undefined) {
    const isHidden =
      element &&
      (element.style.display === 'none' ||
        element.style.visibility === 'hidden');
    if (toBeHidden !== isHidden) {
      throw new Error(
        `期望元素 ${selector} ${toBeHidden ? '隐藏' : '可见'}，但实际状态相反`
      );
    }
  }

  if (toBeInViewport !== undefined) {
    if (element) {
      const rect = element.getBoundingClientRect();
      const isInViewport =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <=
          (window.innerWidth || document.documentElement.clientWidth);
      if (toBeInViewport !== isInViewport) {
        throw new Error(
          `期望元素 ${selector} ${
            toBeInViewport ? '在视口中' : '不在视口中'
          }，但实际状态相反`
        );
      }
    }
  }

  if (toBeOK !== undefined) {
    const isOK = element !== null;
    if (toBeOK !== isOK) {
      throw new Error(
        `期望元素 ${selector} ${toBeOK ? '存在' : '不存在'}，但实际状态相反`
      );
    }
  }

  if (toBeVisible !== undefined) {
    const isVisible =
      element &&
      getComputedStyle(element).display !== 'none' &&
      getComputedStyle(element).visibility !== 'hidden';
    if (toBeVisible !== isVisible) {
      throw new Error(
        `期望元素 ${selector} ${
          toBeVisible ? '可见' : '不可见'
        }，但实际状态相反`
      );
    }
  }

  if (toContainClass) {
    if (!element || !element.classList.contains(toContainClass)) {
      throw new Error(
        `期望元素 ${selector} 包含类名 '${toContainClass}'，但实际不包含`
      );
    }
  }

  if (toContainText) {
    const elementText = element?.textContent || '';
    if (!elementText.includes(toContainText)) {
      throw new Error(
        `期望元素 ${selector} 包含文本 '${toContainText}'，但实际不包含`
      );
    }
  }

  if (toHaveAccessibleDescription) {
    const description = element?.getAttribute('aria-describedby') || '';
    if (description !== toHaveAccessibleDescription) {
      throw new Error(
        `期望元素 ${selector} 的无障碍描述为 '${toHaveAccessibleDescription}'，但实际为 '${description}'`
      );
    }
  }

  if (toHaveAccessibleErrorMessage) {
    const errorMessage = element?.getAttribute('aria-errormessage') || '';
    if (errorMessage !== toHaveAccessibleErrorMessage) {
      throw new Error(
        `期望元素 ${selector} 的无障碍错误消息为 '${toHaveAccessibleErrorMessage}'，但实际为 '${errorMessage}'`
      );
    }
  }

  if (toHaveAccessibleName) {
    const accessibleName = element?.getAttribute('aria-label') || '';
    if (accessibleName !== toHaveAccessibleName) {
      throw new Error(
        `期望元素 ${selector} 的无障碍名称为 '${toHaveAccessibleName}'，但实际为 '${accessibleName}'`
      );
    }
  }

  if (toHaveAttribute) {
    for (const [attr, value] of Object.entries(toHaveAttribute)) {
      const actualValue = element?.getAttribute(attr);
      if (actualValue !== value) {
        throw new Error(
          `期望元素 ${selector} 的属性 '${attr}' 值为 '${value}'，但实际为 '${actualValue}'`
        );
      }
    }
  }

  if (toHaveCSS) {
    for (const [prop, value] of Object.entries(toHaveCSS)) {
      const computedValue = element
        ? getComputedStyle(element).getPropertyValue(prop)
        : '';
      if (computedValue !== value) {
        throw new Error(
          `期望元素 ${selector} 的 CSS 属性 '${prop}' 值为 '${value}'，但实际为 '${computedValue}'`
        );
      }
    }
  }

  if (toHaveClass) {
    if (!element || !element.classList.contains(toHaveClass)) {
      throw new Error(
        `期望元素 ${selector} 具有类名 '${toHaveClass}'，但实际不具有`
      );
    }
  }

  if (toHaveCount !== undefined) {
    const elements = document.querySelectorAll(selector);
    if (elements.length !== toHaveCount) {
      throw new Error(
        `期望选择器 '${selector}' 匹配的元素数量为 ${toHaveCount}，但实际为 ${elements.length}`
      );
    }
  }

  if (toHaveId) {
    if (!element || element.id !== toHaveId) {
      throw new Error(
        `期望元素 ${selector} 的 ID 为 '${toHaveId}'，但实际为 '${element?.id}'`
      );
    }
  }

  if (toHaveJSProperty) {
    for (const [prop, value] of Object.entries(toHaveJSProperty)) {
      const actualValue = (element as any)?.[prop];
      if (actualValue !== value) {
        throw new Error(
          `期望元素 ${selector} 的 JavaScript 属性 '${prop}' 值为 '${value}'，但实际为 '${actualValue}'`
        );
      }
    }
  }

  if (toHaveRole) {
    const role = element?.getAttribute('role') || '';
    if (role !== toHaveRole) {
      throw new Error(
        `期望元素 ${selector} 的角色为 '${toHaveRole}'，但实际为 '${role}'`
      );
    }
  }

  if (toHaveText) {
    const elementText = element?.textContent || '';
    if (elementText !== toHaveText) {
      throw new Error(
        `期望元素 ${selector} 的文本内容为 '${toHaveText}'，但实际为 '${elementText}'`
      );
    }
  }

  if (toHaveTitle) {
    const pageTitle = document.title;
    if (pageTitle !== toHaveTitle) {
      throw new Error(
        `期望页面标题为 '${toHaveTitle}'，但实际为 '${pageTitle}'`
      );
    }
  }

  if (toHaveURL) {
    const currentURL = window.location.href;
    if (currentURL !== toHaveURL) {
      throw new Error(
        `期望页面 URL 为 '${toHaveURL}'，但实际为 '${currentURL}'`
      );
    }
  }

  if (toHaveValue) {
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    ) {
      if (element.value !== toHaveValue) {
        throw new Error(
          `期望元素 ${selector} 的值为 '${toHaveValue}'，但实际为 '${element.value}'`
        );
      }
    } else {
      throw new Error(
        `期望元素 ${selector} 为输入框、文本区域或下拉列表元素，以便检查值`
      );
    }
  }

  if (toHaveValues) {
    if (element instanceof HTMLSelectElement) {
      const selectedValues = Array.from(element.options)
        .filter((option) => option.selected)
        .map((option) => option.value);
      if (JSON.stringify(selectedValues) !== JSON.stringify(toHaveValues)) {
        throw new Error(
          `期望元素 ${selector} 的选中值为 '${JSON.stringify(
            toHaveValues
          )}'，但实际为 '${JSON.stringify(selectedValues)}'`
        );
      }
    } else {
      throw new Error(`期望元素 ${selector} 为下拉列表元素，以便检查多个值`);
    }
  }
  if (toPassCode) {
    try {
      const func = new Function('element', 'context', 'params', toPassCode);
      const pass = await func(element, context, codeParams);
      if (!pass) {
        throw new Error('自定义通过条件未满足');
      }
    } catch (error) {
      throw new Error(`执行自定义代码时出错: ${error}`);
    }
  }

  return {
    status: 'success',
    result: { message: '期望检查通过' },
  };
};
