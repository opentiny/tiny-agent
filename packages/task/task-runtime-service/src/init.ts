import TaskScheduler from './task-scheduler';
import { TaskUI } from './task-ui';
import ActionManager from './action-manager';
import { t } from './locale/i18n';
import type { Action, ISchedulerContext } from './types';

const createScheduler = (actions: Action[], context: ISchedulerContext) => {
  const actionManager = new ActionManager();
  const taskUI = new TaskUI({
    title: t('scheduler.startDesc'),
  });
  const taskScheduler = new TaskScheduler(actionManager, context, taskUI);
  actionManager.registerActions(actions);

  return { taskScheduler, actionManager };
};

export { createScheduler };
