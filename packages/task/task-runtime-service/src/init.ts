import TaskScheduler from './task-scheduler';
import { TaskUI } from './task-ui';
import ActionManager from './action-manager';
import type { Action, ISchedulerContext, ITaskDescription } from './types';

const initConnect = (taskScheduler: TaskScheduler) => {
  // mock 通信层
  const onMessage = (task: ITaskDescription) => {
    // 可以在这里调用 taskScheduler.doTask() 来处理消息
    return taskScheduler.doTask(task);
  };

  window.sendMessage = async (task: ITaskDescription) => {
    try {
      const result = await onMessage(task);
      console.log('Result:', result);
    } catch (err) {
      console.error('Error:', err);
      return Promise.reject(err);
    }
  };
};

const createScheduler = (actions: Action[], context: ISchedulerContext) => {
  const actionManager = new ActionManager();
  const taskUI = new TaskUI({
    title: 'AI操作中，您可以暂停或终止',
  });
  const taskScheduler = new TaskScheduler(actionManager, context, taskUI);
  actionManager.registerActions(actions);
  initConnect(taskScheduler);

  return { taskScheduler, actionManager };
};

export { createScheduler };
