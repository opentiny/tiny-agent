import { TaskScheduler, type ISchedulerContext } from './task-scheduler';
import { TaskUI } from './task-ui';
import { ActionManager } from './action-manager';
import { t } from './locale/i18n';
import type { IAction } from './action.type';

export function createScheduler(
  actions: IAction[],
  context: ISchedulerContext
) {
  const actionManager = new ActionManager();
  const taskUI = new TaskUI({
    title: t('scheduler.startDesc'),
  });
  const taskScheduler = new TaskScheduler(actionManager, context);
  taskScheduler.connectTaskUI(taskUI);
  actionManager.registerActions(actions);

  return { taskScheduler, actionManager };
}
