import type { IAction } from './action.type';

// ACTION管理类
export class ActionManager {
  protected actions: { [name: string]: IAction } = {};

  // 注册ACTION
  registerAction(action: IAction): void {
    if (this.actions[action.name]) {
      throw new Error(action.name + 'action name already exists');
    }
    this.actions[action.name] = action;
  }

  // 批量注册ACTION
  registerActions(actions: IAction[]): void {
    actions.forEach((action) => this.registerAction(action));
  }

  // 清空ACTION
  clearActions(): void {
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
  getActionList(): IAction[] {
    return Object.values(this.actions);
  }

  // 覆盖原有ACTION
  overrideAction(action: IAction): void {
    this.actions[action.name] = action;
  }

  findAction(name: string): IAction | undefined {
    return this.actions[name];
  }
}
