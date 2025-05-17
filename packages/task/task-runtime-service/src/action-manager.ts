import { Action, IActionResult } from './types';

// ACTION管理类
class ActionManager {
  private actions: { [name: string]: Action } = {};

  // 注册ACTION
  registerAction(action: Action): void {
    if (this.actions[action.name]) {
      throw new Error(action.name + '名已被使用');
    }
    this.actions[action.name] = action;
  }

  // 批量注册ACTION
  registerActions(actions: Action[]): void {
    actions.forEach((action) => this.registerAction(action));
  }

  // 清空ACTION
  clearActions() {
    this.actions = {};
  }

  // 卸载ACTION
  unregisterAction(name: string): void {
    if (this.actions[name]) {
      delete this.actions[name];
    }
  }

  unregisterActions(names: string[]): void {
    names.forEach((name) => this.unregisterAction(name));
  }

  // 获取ACTION列表
  getActionList(): Action[] {
    return Object.values(this.actions);
  }

  // 覆盖原有ACTION
  overrideAction(action: Action): void {
    this.actions[action.name] = action;
  }

  findAction(name: string): Action | undefined {
    return this.actions[name];
  }
}

export { ActionManager };

export default ActionManager;
