import type { ActionManager } from './action-manager';
import type { ITaskExecutor, ITaskResult } from './task';
import type { ITaskSchema } from './schema.type';
import type { ITaskUI } from './task-ui';
import type { IActionContext } from './action.type';
import { Task } from './task';
import { t } from './locale/i18n';

export interface ISchedulerContext extends IActionContext {
  $task?: ITaskExecutor;
  $taskUI?: ITaskUI;
}

export interface ITasksQueueItem {
  id: string;
  resolve: (result: ITaskResult) => void;
  reject: (error: unknown) => void;
  taskFn: () => Promise<ITaskResult>;
}

export class TaskScheduler {
  protected tasksQueue: ITasksQueueItem[] = [];
  protected isExecuting = false;
  protected context: ISchedulerContext;
  protected actionManager: ActionManager;
  protected task: ITaskExecutor | null = null;
  protected taskUI: ITaskUI | undefined;

  constructor(actionManager: ActionManager, context?: ISchedulerContext) {
    // 注册所有的ACTION并且提供上下文
    this.context = context || {};
    this.actionManager = actionManager;
  }

  addContext(context: ISchedulerContext) {
    this.context = {
      ...this.context,
      ...context,
    };
  }

  connectTaskUI(taskUI: ITaskUI) {
    this.taskUI = taskUI;
    if (this.taskUI) {
      this.addContext({
        $taskUI: this.taskUI,
      });
      this.taskUI.on('pause', () => {
        this.task!.pause();
      });
      this.taskUI.on('skip', () => {
        this.task!.skip();
      });
      this.taskUI.on('resume', () => {
        this.task!.resume();
      });
      this.taskUI.on('stop', () => {
        this.task!.stop();
      });
    }
  }

  connectTask(task: ITaskExecutor) {
    this.task = task;
    if (this.task) {
      this.task.on('start', () => {
        this.taskUI?.show();
      });
      this.task.on('pause', () => {
        this.taskUI?.pause();
      });
      this.task.on('resume', () => {
        this.taskUI?.resume();
      });
      this.task.on('finish', () => {
        this.taskUI?.stop();
      });
      this.task.on('beforeStep', ({ index }: { index: number; instruction: any }) => {
        this.taskUI?.setTitle?.(`${t('scheduler.executingStep')} ${index}`);
      });
    }
  }

  pushTask(taskDescription: ITaskSchema): Promise<ITaskResult> {
    return new Promise((resolve, reject) => {
      const { instructions, id } = taskDescription;
      const taskContext = { ...this.context };
      const task = new Task(this.actionManager, taskContext);
      this.connectTask(task);
      const taskFn = () => this.task!.execute(instructions);
      this.tasksQueue.push({ taskFn, id, resolve, reject });
      this.execute();
    });
  }

  // 执行队列中的任务
  async execute() {
    if (this.isExecuting || this.tasksQueue.length === 0) {
      return;
    }
    this.isExecuting = true;
    const tasksQueueItem = this.tasksQueue.shift();
    if (!tasksQueueItem) {
      return;
    }
    const { taskFn, resolve, reject } = tasksQueueItem;
    try {
      const result = await taskFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.isExecuting = false;
      this.execute();
    }
  }
}
