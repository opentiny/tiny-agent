import { Action } from "../common/action";

 // ACTION管理类
 export class ActionManager {
   private actions: { [name: string]: Action } = {};
 
   // 注册ACTION
   registerAction(plugin: Action): void {
     if (this.actions[plugin.name]) {
       throw new Error('action名已被使用');
     }
     this.actions[plugin.name] = plugin;
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
 
   // 获取ACTION列表
   getActionList(): Action[] {
     return Object.values(this.actions);
   }
 
   // 覆盖原有ACTION
   overrideAction(action: Action): void {
     this.actions[action.name] = action;
   }
 
   // 执行ACTION操作
   executeAction(
     name: string,
     params: { [key: string]: any },
     context?: any
   ) {
     const plugin = this.actions[name];
     if (plugin) {
       return plugin.execute(params, context);
     }
     return {
       status: 'error',
       error: {message: `未找到名为 '${name}' 的ACTION`},
     };
   }
 }