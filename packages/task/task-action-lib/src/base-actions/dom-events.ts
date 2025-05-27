export const rawEvents = {
  pointerrawupdate: () => new PointerEvent('pointerrawupdate'),
  pointerover: () => new PointerEvent('pointerover'),
  pointerenter: () => new PointerEvent('pointerenter'),
  mouseover: () => new MouseEvent('mouseover'),
  mouseenter: () => new MouseEvent('mouseenter'),
  pointermove: () => new PointerEvent('pointermove'),
  mousemove: () => new MouseEvent('mousemove'),
  pointerdown: () => new PointerEvent('pointerdown'),
  mousedown: () => new MouseEvent('mousedown'),
  pointerup: () => new PointerEvent('pointerup'),
  mouseup: () => new MouseEvent('mouseup'),
  click: () => new MouseEvent('click'),
  keydown: (char: string) => new KeyboardEvent('keydown', { key: char }),
  keypress: (char: string) => new KeyboardEvent('keypress', { key: char }),
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
  selectionchange: () => new Event('selectionchange'),
  keyup: (char: string) => new KeyboardEvent('keyup', { key: char }),
  pointerout: () => new PointerEvent('pointerout'),
  pointerleave: () => new PointerEvent('pointerleave'),
  mouseout: () => new MouseEvent('mouseout'),
  mouseleave: () => new MouseEvent('mouseleave'),
  change: () => new Event('change'),
  focus: () => new FocusEvent('focus'),
  blur: () => new FocusEvent('blur'),
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
