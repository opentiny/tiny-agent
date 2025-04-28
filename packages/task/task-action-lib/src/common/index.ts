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
    `在 ${timeout / 1000} 秒内未找到匹配选择器 '${selector}' 的元素`
  );
};

export const rawEvents = {
  pointerrawupdate: () =>
    new PointerEvent('pointerrawupdate', { bubbles: true }),
  pointerover: () => new PointerEvent('pointerover', { bubbles: true }),
  pointerenter: () => new PointerEvent('pointerenter', { bubbles: true }),
  mouseover: () => new MouseEvent('mouseover', { bubbles: true }),
  mouseenter: () => new MouseEvent('mouseenter', { bubbles: true }),
  pointermove: () => new PointerEvent('pointermove', { bubbles: true }),
  mousemove: () => new MouseEvent('mousemove', { bubbles: true }),
  pointerdown: () => new PointerEvent('pointerdown', { bubbles: true }),
  mousedown: () => new MouseEvent('mousedown', { bubbles: true }),
  pointerup: () => new PointerEvent('pointerup', { bubbles: true }),
  mouseup: () => new MouseEvent('mouseup', { bubbles: true }),
  click: () => new MouseEvent('click', { bubbles: true }),
  keydown: (char: string) =>
    new KeyboardEvent('keydown', { key: char, bubbles: true }),
  keypress: (char: string) =>
    new KeyboardEvent('keypress', { key: char, bubbles: true }),
  beforeinput: (char: string) =>
    new InputEvent('beforeinput', {
      inputType: 'insertText',
      data: char,
      bubbles: true,
    }),
  input: (char: string) =>
    new InputEvent('input', {
      inputType: 'insertText',
      data: char,
      bubbles: true,
    }),
  selectionchange: () => new Event('selectionchange', { bubbles: true }),
  keyup: (char: string) =>
    new KeyboardEvent('keyup', { key: char, bubbles: true }),
  pointerout: () => new PointerEvent('pointerout', { bubbles: true }),
  pointerleave: () => new PointerEvent('pointerleave', { bubbles: true }),
  mouseout: () => new MouseEvent('mouseout', { bubbles: true }),
  mouseleave: () => new MouseEvent('mouseleave', { bubbles: true }),
  change: () => new Event('change', { bubbles: true }),
  focus: () => new FocusEvent('focus', { bubbles: true }),
  blur: () => new FocusEvent('blur', { bubbles: true }),
};

export const commonEvents = {
  // 鼠标从输入框外移入输入框内
  get mouseEnter() {
    return [
      rawEvents.pointerrawupdate(),
      rawEvents.pointerover(),
      rawEvents.pointerenter(),
      rawEvents.mouseover(),
      rawEvents.mouseenter(),
      rawEvents.pointermove(),
      rawEvents.mousemove(),
    ];
  },
  // 点击
  get mouseClickFocus() {
    return [
      rawEvents.pointerdown(),
      rawEvents.mousedown(),
      rawEvents.focus(),
      rawEvents.pointerup(),
      rawEvents.mouseup(),
    ];
  },
  get mouseLeave() {
    return [
      rawEvents.pointerrawupdate(),
      rawEvents.pointermove(),
      rawEvents.mousemove(),
      rawEvents.pointerout(),
      rawEvents.pointerleave(),
      rawEvents.mouseout(),
      rawEvents.mouseleave(),
    ];
  },
  get mouseBlur() {
    return [rawEvents.change(), rawEvents.blur()];
  },
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

export const getElementByText = async (
  selector: string | HTMLElement,
  text: string,
  timeout: number = 3000
): Promise<HTMLElement> => {
  let element: HTMLElement;
  if (typeof selector === 'string') {
    element = await findElement(selector, timeout);
  } else if (selector instanceof HTMLElement) {
    element = selector;
  } else {
    throw new Error('selector 必须是字符串或 HTMLElement');
  }
  const result = document.evaluate(
    `.//*[normalize-space(text())='${text.replace(/'/g, "\\'")}']`,
    element,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  );
  if (!result.singleNodeValue) {
    throw new Error(`未找到文本内容为 '${text}' 的元素`);
  }
  return result.singleNodeValue;
};
