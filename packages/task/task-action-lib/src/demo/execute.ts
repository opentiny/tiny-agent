import { ActionManager } from "./actionManager";

export async function executeActions(
  manager: ActionManager,
  actionList: { action: string; params: any; context?: any }[]
) {
  if (!actionList.length) {
    return {};
  }
  let preResult: any = null;
  for (const { action, params, context } of actionList) {
    try {
      const { status, result } = await manager.executeAction(
        action,
        { ...preResult, ...params },
        context
      );
      if (status === 'success') {
        // 将上一个 action 结果作为下一个 action 入参
        preResult = result;
      } else {
        throw new Error(`执行 action ${action} 时出错:${result}`);
      }
    } catch (error) {
      throw new Error(`执行 action ${action} 时出错: ${error}`);
    }
  }
  return preResult;
}