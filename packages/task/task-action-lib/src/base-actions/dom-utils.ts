import { t } from '../locale/i18n';
import { commonEvents } from './dom-events';

export const findElement = async (
  selector: string,
  timeout: number = 3000
): Promise<HTMLElement> => {
  const interval = 100; // 轮询间隔 100 毫秒
  const endTime = Date.now() + timeout;

  while (Date.now() < endTime) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      return element;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(
    t('domActions.errorMsg.findElement', {
      timeout: String(timeout / 1000),
      selector,
    })
  );
};

export const getElementByText = async (
  selector: string | HTMLElement,
  text: string,
  timeout: number = 3000
): Promise<Node> => {
  let element: HTMLElement;
  if (typeof selector === 'string') {
    element = await findElement(selector, timeout);
  } else if (selector instanceof HTMLElement) {
    element = selector;
  } else {
    throw new Error(t('domActions.errorMsg.selector'));
  }
  const result = document.evaluate(
    `.//*[normalize-space(text())='${text.replace(/'/g, "\\'")}']`,
    element,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  );
  if (!result.singleNodeValue) {
    throw new Error(t('domActions.errorMsg.textNotFound', { text }));
  }
  return result.singleNodeValue;
};

// 一些事件模拟人操作，会有延时
export const dispatchEvent = (
  target: HTMLElement,
  event: Event,
  delay = 10
): Promise<void> => {
  return new Promise((resolve) => {
    target.dispatchEvent(event);
    // 模拟人类操作的延迟
    setTimeout(resolve, delay);
  });
};
/**
 * 模拟用户点击按钮
 * @param target 目标点击按钮元素
 */
export async function simulateClick(target: HTMLElement): Promise<void> {
  // 鼠标移入
  for (const event of commonEvents.mouseEnter) {
    await dispatchEvent(target, event);
  }
  // 点击选择
  for (const event of commonEvents.mouseClickFocus) {
    await dispatchEvent(target, event);
  }
  await dispatchEvent(target, new MouseEvent('click', { bubbles: true }));

  // 鼠标移出
  for (const event of commonEvents.mouseLeave) {
    await dispatchEvent(target, event);
  }

  if (target.tagName === 'input') {
    // 触发失焦change事件
    for (const event of commonEvents.mouseBlur) {
      await dispatchEvent(target, event);
    }
  }
}
