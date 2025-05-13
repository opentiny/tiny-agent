import type { Action, ITask, TaskResult, ISchedulerContext } from './types';
import { Task } from './task';

class TaskScheduler {
  private tasksQueue: any = [];
  private isExecuting = false;
  public task: Task;

  constructor(actions: Action[], context: ISchedulerContext) {
    const task = new Task();
    this.task = task;
    // 注册所有的ACTION并且提供上下文
    this.task.registerActions(actions);
    this.task.provideContext(context);
  }

  doTask(task: ITask): Promise<TaskResult> {
    return new Promise((resolve, reject) => {
      const { instructions, id } = task;
      const taskFn = () => this.task.execute(instructions); // 执行任务
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
