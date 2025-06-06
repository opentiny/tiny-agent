// 简单处理工具调用开始和结束的展示条
export class SimpleToolCallHandler {
  constructor() {
    this.styleElementIds = new Set();
    this.initStyles();
    this.updateToolTimer = null;
  }

  shouldHandle(extra) {
    return extra?.toolCall;
  }

  handler(extra, handler) {
    const styleElement = this.getStyle(extra);
    if (!styleElement) {
      const { onData } = handler;
      onData({ choices: [{ delta: { content: this.createElement(extra) } }] });
      this.updateToolTimer = setTimeout(() => {
        this.updateTool(extra);
        this.updateToolTimer = null;
      }, 0);
    } else {
      if (this.updateToolTimer) {
        clearTimeout(this.updateToolTimer);
        this.updateToolTimer = null;
      }
      this.updateTool(extra);
    }
  }

  handlerStatic(extra) {
    if(extra.toolCall & extra.callToolResult) {
      this.updateTool(extra);
      return this.createElement(extra);
    }
    return '';
  }

  createElement(extra) {
    this.createStyle(extra);
    return `<div class="tool-call simple-tool-call-handler" id="${extra.toolCall.id}"></div>`;
  }

  createStyle(extra) {
    const style = document.createElement('style');
    style.id = `tool_call_${extra.toolCall.id}`;
    document.head.appendChild(style);
    this.styleElementIds.add(style.id);
  }

  getStyle(extra) {
    return document.querySelector(`#tool_call_${extra.toolCall.id}`);
  }

  getElement(extra) {
    return document.querySelector(`div.tool-call#${extra.toolCall.id}`)
  }

  updateTool(extra) {
    const style = this.getStyle(extra);
    if (!style) {
      console.warn('no tool call info')
      return;
    }

    if (extra.callToolResult) {
      style.innerHTML = `
       .tool-call#${extra.toolCall.id}::after {
         content: '调用工具 ${extra.toolCall.function.name} ${extra.callToolResult.isError ? '失败 ❌' : '成功 ✅'}'
       }
      `
    } else {
      style.innerHTML = `
       .tool-call#${extra.toolCall.id}::after {
         content: '正在调用工具 ${extra.toolCall.function.name} ...'
       }
         `
    }
  }

  initStyles() {
    const style = document.createElement('style');
    style.id = 'simple-tool-call-handler-base-styles';
    style.innerHTML = `
      div.tool-call.simple-tool-call-handler {
        padding: 8px 16px;
        margin: 12px 0;
        background: #EFEFEF;
        border: #EEE 1px solid;
        border-radius: 10px;
      }
    `
    document.head.appendChild(style);
    this.styleElementIds.add(style.id);
  }

  cleanup() {
    if (this.updateToolTimer) {
      clearTimeout(this.updateToolTimer);
      this.updateToolTimer = null;
    }

    this.styleElementIds.forEach(styleId => {
      const element = document.getElementById(styleId);
      element?.remove();
    });
    this.styleElementIds.clear();
  }
}
