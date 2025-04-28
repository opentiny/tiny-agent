import { commonEvents, dispatchEvent } from '../common';

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
