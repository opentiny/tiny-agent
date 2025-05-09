import TaskScheduler from './taskScheduler';
import SchedulerUI from './schedulerUI';
import type { Action, SchedulerContext, Task, Scheduler } from './types';
import ActionScheduler from './actionScheduler';

const initUI = (actionScheduler: ActionScheduler) => {
  let ui = new SchedulerUI({
    title: 'AI操作中，您可以暂停或终止',
  });

  ui.on('pause', () => {
    actionScheduler.waitPause();
  });
  ui.on('skip', () => {
    actionScheduler.skip();
  });
  ui.on('resume', () => {
    actionScheduler.resume();
  });
  ui.on('stop', () => {
    actionScheduler.stop();
  });

  actionScheduler.on('start', () => {
    ui.show();
  });

  actionScheduler.provideContext({
    $ui: {
      tipToResume: ui.tipToResume.bind(ui),
    },
  });
  actionScheduler.on('pause', () => {
    ui.pause();
  });

  actionScheduler.on('resume', () => {
    ui.resume();
  });

  actionScheduler.on('finish', () => {
    ui.stop();
  });

  actionScheduler.on(
    'beforeStep',
    ({ index, instruction }: { index: number; instruction: any }) => {
      ui.setTitle(`执行指令${index}`);
    }
  );
};

const initConnect = (taskScheduler: TaskScheduler) => {
  // mock 通信层
  const onMessage = (task: Task) => {
    // 可以在这里调用 taskScheduler.doTask() 来处理消息
    return taskScheduler.doTask(task);
  };

  window.sendMessage = async (task: Task) => {
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
  context: SchedulerContext
): Scheduler => {
  const taskScheduler = new TaskScheduler(actions, context);
  const actionScheduler = taskScheduler.actionScheduler;
  const api = ['registerActions', 'registerAction', 'provideContext'] as const;
  const scheduler: Partial<Scheduler> = {};

  api.forEach((method) => {
    if (method in actionScheduler) {
      scheduler[method] = (actionScheduler as any)[method].bind(taskScheduler);
    }
  });

  scheduler.install = () => {
    initUI(actionScheduler);
    initConnect(taskScheduler);
  };

  return scheduler as Scheduler;
};

export { createScheduler };
