import TaskScheduler from './TaskScheduler';
import SchedulerUI from './SchedulerUI';

const initUI = (actionScheduler) => {
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

  actionScheduler.on('beforeStep', ({ index, instruction }) => {
    ui.setTitle(`执行指令${index}`);
  });
};

const initConnect = (taskScheduler) => {
  // mock 通信层
  const onMessage = (task: any) => {
    // 可以在这里调用 taskScheduler.doTask() 来处理消息
    return taskScheduler.doTask(task);
  };

  window.sendMessage = async (task: any) => {
    try {
      const result = await onMessage(task);
      console.log('Result:', result);
    } catch (err) {
      console.error('Error:', err);
      throw new Error(err);
    }
  };
};

const createScheduler = (actions, context) => {
  const taskScheduler = new TaskScheduler(actions, context);
  const actionScheduler = taskScheduler.actionScheduler;
  const api = ['registerActions', 'registerAction', 'provideContext'];
  const scheduler = {};
  api.forEach((method) => {
    scheduler[method] = actionScheduler[method].bind(taskScheduler);
  });

  scheduler.install = () => {
    initUI(actionScheduler);
    initConnect(taskScheduler);
  };
  return scheduler;
};

export { createScheduler };
