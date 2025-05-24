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
