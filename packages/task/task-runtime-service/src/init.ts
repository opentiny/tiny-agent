import TaskScheduler from './task-scheduler';
import { TaskUI } from './task-ui';
import type { Action, ISchedulerContext, ITask, IScheduler } from './types';
import { Task } from './task';

const initUI = (task: Task) => {
  let ui = new TaskUI({
    title: 'AI操作中，您可以暂停或终止',
  });

  ui.on('pause', () => {
    task.waitPause();
  });
  ui.on('skip', () => {
    task.skip();
  });
  ui.on('resume', () => {
    task.resume();
  });
  ui.on('stop', () => {
    task.stop();
  });

  task.on('start', () => {
    ui.show();
  });

  task.provideContext({
    $ui: {
      tipToResume: ui.tipToResume.bind(ui),
    },
  });
  task.on('pause', () => {
    ui.pause();
  });

  task.on('resume', () => {
    ui.resume();
  });

  task.on('finish', () => {
    ui.stop();
  });

  task.on(
    'beforeStep',
    ({ index, instruction }: { index: number; instruction: any }) => {
      ui.setTitle(`执行指令${index}`);
    }
  );
};

const initConnect = (taskScheduler: TaskScheduler) => {
  // mock 通信层
  const onMessage = (task: ITask) => {
    // 可以在这里调用 taskScheduler.doTask() 来处理消息
    return taskScheduler.doTask(task);
  };

  window.sendMessage = async (task: ITask) => {
    try {
      const result = await onMessage(task);
      console.log('Result:', result);
    } catch (err) {
      console.error('Error:', err);
      return Promise.reject(err);
    }
  };
};

const createScheduler = (
  actions: Action[],
  context: ISchedulerContext
): IScheduler => {
  const taskScheduler = new TaskScheduler(actions, context);
  const task = taskScheduler.task;
  const api = ['registerActions', 'registerAction', 'provideContext'] as const;
  const scheduler: Partial<IScheduler> = {};

  api.forEach((method) => {
    if (method in task) {
      scheduler[method] = (task as any)[method].bind(taskScheduler);
    }
  });

  scheduler.install = () => {
    initUI(task);
    initConnect(taskScheduler);
  };

  return scheduler as IScheduler;
};

export { createScheduler };
