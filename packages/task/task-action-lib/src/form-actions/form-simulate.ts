import { dispatchEvent } from '../base-actions';
import { inputEvents, selectEvents } from '../form-actions';

/**
 * 模拟用户在输入框中的操作
 * @param target 目标输入框元素
 * @param inputText 要输入的文本内容
 */
export async function simulateUserInput(
  target: HTMLInputElement | HTMLTextAreaElement,
  inputText: string
): Promise<void> {
  // 1. 鼠标从输入框外移入输入框内
  for (const event of inputEvents.mouseEnter) {
    await dispatchEvent(target, event);
  }

  // 2. 按下鼠标聚焦到输入框
  for (const event of inputEvents.mouseClickFocus) {
    await dispatchEvent(target, event);
  }

  target.value = '';
  // 3. 输入字符
  for (const char of inputText) {
    const charEvents = inputEvents.inputChar(char);
    for (const event of charEvents) {
      if (event.type === 'input') {
        target.value += char;
      }

      await dispatchEvent(target, event);
      // 滚动到最右下边
      target.scrollLeft = target.scrollWidth;
      target.scrollTop = target.scrollHeight;
    }
  }
}

/**
 * 模拟用户选择单选按钮
 * @param target 目标单选按钮元素
 */
export async function simulateRadioSelection(
  target: HTMLInputElement
): Promise<void> {
  // 鼠标移入
  for (const event of inputEvents.mouseEnter) {
    await dispatchEvent(target, event);
  }
  // 点击选择
  for (const event of inputEvents.mouseClickFocus) {
    await dispatchEvent(target, event);
  }
  // 触发 change 事件
  await dispatchEvent(target, new Event('change', { bubbles: true }));
  // 鼠标移出
  for (const event of inputEvents.mouseLeave) {
    await dispatchEvent(target, event);
  }
  target.checked = true;
}

/**
 * 模拟用户选择复选框
 * @param target 目标复选框元素
 * @param checked 是否选中
 */
export async function simulateCheckboxSelection(
  target: HTMLInputElement,
  checked: boolean
): Promise<void> {
  // 鼠标移入
  for (const event of inputEvents.mouseEnter) {
    await dispatchEvent(target, event);
  }
  // 点击操作
  for (const event of inputEvents.mouseClickFocus) {
    await dispatchEvent(target, event);
  }
  // 触发 change 事件
  await dispatchEvent(target, new Event('change', { bubbles: true }));
  // 鼠标移出
  for (const event of inputEvents.mouseLeave) {
    await dispatchEvent(target, event);
  }
  target.checked = checked;
}

/**
 * 模拟用户选择下拉列表选项
 * @param target 目标下拉列表元素
 * @param value 要选择的选项值
 */
export async function simulateSelectOption(
  target: HTMLSelectElement,
  value: string
): Promise<void> {
  // 鼠标移入
  for (const event of selectEvents.mouseEnter) {
    await dispatchEvent(target, event);
  }
  // 点击展开下拉列表
  for (const event of selectEvents.mouseClickFocus) {
    await dispatchEvent(target, event);
  }

  // 选择选项
  for (let i = 0; i < target.options.length; i++) {
    if (target.options[i].value === value) {
      target.selectedIndex = i;
      await dispatchEvent(target, new Event('change', { bubbles: true }), 200);
      break;
    }
  }

  // 鼠标移出
  for (const event of selectEvents.mouseLeave) {
    await dispatchEvent(target, event);
  }
}

/**
 * 模拟用户点击提交按钮
 * @param target 目标提交按钮元素
 */
export async function simulateSubmitClick(
  target: HTMLInputElement
): Promise<void> {
  // 鼠标移入
  for (const event of inputEvents.mouseEnter) {
    await dispatchEvent(target, event);
  }
  // 点击提交
  for (const event of inputEvents.mouseClickFocus) {
    await dispatchEvent(target, event);
  }
  // 触发 click 事件
  await dispatchEvent(target, new MouseEvent('click', { bubbles: true }));
  // 鼠标移出
  for (const event of inputEvents.mouseLeave) {
    await dispatchEvent(target, event);
  }
}
