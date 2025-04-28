import { commonEvents, rawEvents } from '../common';

// 定义输入事件对象，引用归类好的事件
export const inputEvents = {
  // 鼠标从输入框外移入输入框内
  get mouseEnter() {
    return commonEvents.mouseEnter;
  },
  // 按下鼠标聚焦到输入框
  get mouseClickFocus() {
    return [
      rawEvents.pointerdown(),
      rawEvents.mousedown(),
      rawEvents.pointerup(),
      rawEvents.mouseup(),
      rawEvents.click(),
    ];
  },

  // 输入一个字符
  inputChar: (char: string) => [
    rawEvents.keydown(char),
    rawEvents.keypress(char),
    rawEvents.beforeinput(char),
    rawEvents.input(char),
    rawEvents.selectionchange(),
    rawEvents.keyup(char),
  ],
  get mouseLeave() {
    return [...commonEvents.mouseLeave, ...commonEvents.mouseBlur];
  },
};

export const selectEvents = {
  // 鼠标从输入框外移入输入框内
  get mouseEnter() {
    return commonEvents.mouseEnter;
  },
  //  按下鼠标打开下拉框
  get mouseClickFocus() {
    return [
      rawEvents.pointerdown(),
      rawEvents.mousedown(),
      rawEvents.focus(),
      rawEvents.pointerrawupdate(),
      rawEvents.pointermove(),
      rawEvents.pointerup(),
      rawEvents.mouseup(),
      rawEvents.click(),
    ];
  },

  get mouseLeave() {
    return commonEvents.mouseLeave;
  },
};
