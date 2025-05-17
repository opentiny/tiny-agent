import type {
  Action,
  ITaskDescription,
  TaskResult,
  ISchedulerContext,
} from './types';
import { Task } from './task';
import ActionManager from './action-manager';
import { TaskUI } from './task-ui';

class TaskScheduler {
  private tasksQueue: any = [];
  private isExecuting = false;
  private context: ISchedulerContext;
  private actionManager: ActionManager;
  private task: Task | null = null;
  private taskUI: TaskUI | undefined;

  constructor(
    actionManager: ActionManager,
    context: ISchedulerContext,
    taskUI?: TaskUI
  ) {
    // 注册所有的ACTION并且提供上下文
    this.context = context;
    this.actionManager = actionManager;
    this.taskUI = taskUI;
  }

  addContext(context: ISchedulerContext) {
    this.context = {
      ...this.context,
      ...context,
    };
  }

  connectTaskUI() {
    if (this.taskUI && this.task) {
      this.taskUI.on('pause', () => {
        this.task!.waitPause();
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
      this.task.on('start', () => {
        this.taskUI!.show();
      });
      this.task.on('pause', () => {
        this.taskUI!.pause();
      });
      this.task.on('resume', () => {
        this.taskUI!.resume();
      });
      this.task.on('finish', () => {
        this.taskUI!.stop();
      });
      this.task.on(
        'beforeStep',
        ({ index, instruction }: { index: number; instruction: any }) => {
          this.taskUI!.setTitle(`执行指令${index}`);
        }
      );
    }
  }

  doTask(taskDescription: ITaskDescription): Promise<TaskResult> {
    return new Promise((resolve, reject) => {
      const { instructions, id } = taskDescription;
      const taskContext = { ...this.context };
      if (this.taskUI) {
        taskContext.$taskUI = this.taskUI;
      }
      this.task = new Task(this.actionManager, taskContext);
      this.connectTaskUI();
      const taskFn = () => this.task!.execute(instructions); // 执行任务
      this.tasksQueue.push({ taskFn, id, resolve, reject }); // 将任务及回调存入队列
      this.execute(); // 尝试执行下一个任务
    });
  }

  // 执行队列中的任务
  async execute() {
    if (this.isExecuting || this.tasksQueue.length === 0) {
      return;
    }
    this.isExecuting = true; // 标记为正在执行
    const { taskFn, id, resolve, reject } = this.tasksQueue.shift(); // 取出第一个任务
    try {
      const result = await taskFn();
      result.id = id;
      resolve(result); // 返回成功结果
    } catch (error: any) {
      error.id = id;
      reject(error); // 返回失败结果
    } finally {
      this.isExecuting = false; // 重置执行状态
      this.execute(); // 继续执行下一个任务
    }
  }
}

export default TaskScheduler;
