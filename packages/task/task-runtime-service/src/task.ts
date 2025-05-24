import type { IInstructionSchema } from './schema.type';
import type { ISchedulerContext } from './task-scheduler';
import { ActionResultStatus } from './action.type';
import { ActionManager } from './action-manager';
import { EventEmitter } from './event-emitter';
import { Instruction } from './instruction';
import { t } from './locale/i18n';

export enum TaskResultStatus {
  Success = 'success',
  Error = 'error',
  PartialCompleted = 'partial completed',
}

export interface ITaskResult {
  status: TaskResultStatus;
  index: number;
  instruction?: IInstructionSchema;
  result?: { [key: string]: any };
  error?: { message: string; stack?: string };
}

// 执行器状态枚举
export enum ExecutorStatus {
  Idle = 'idle',
  Running = 'running',
  Paused = 'paused',
}

export type ITaskExecutorEvent =
  | 'start'
  | 'beforeStep'
  | 'pause'
  | 'resume'
  | 'finish';
export interface ITaskExecutor {
  pause(): Promise<void>;
  resume(): void;
  skip(): void;
  stop(): Promise<void>;
  addCleanEffect(fn: () => void): void;
  on(event: ITaskExecutorEvent, listener: (...args: any[]) => void): void;
  execute(instructions: IInstructionSchema[]): Promise<ITaskResult>;
}

export interface IExecutorInfo {
  instructions: IInstructionSchema[];
  currentIndex: number;
  status: ExecutorStatus;
  resolve: ((value: ITaskResult) => void) | null;
  reject: ((value: ITaskResult) => void) | null;
  pauseResolve: (() => void) | null;
  waitPromise: Promise<void> | null;
}

export class Task implements ITaskExecutor {
  protected actionManager: ActionManager;
  protected context: ISchedulerContext;
  protected emitter: EventEmitter;
  protected executorInfo!: IExecutorInfo;

  protected taskResult!: ITaskResult;

  protected cleanEffectFns!: (() => void)[];

  constructor(actionManager: ActionManager, context: ISchedulerContext) {
    this.emitter = new EventEmitter();
    this.initialize();

    this.context = {
      ...context,
      $task: this.initProvideTask(),
    };
    this.actionManager = actionManager;
  }

  protected initialize() {
    this.executorInfo = {
      instructions: [],
      currentIndex: 0,
      status: ExecutorStatus.Idle,
      resolve: null,
      reject: null,
      pauseResolve: null,
      waitPromise: null,
    };
    this.taskResult = {
      status: TaskResultStatus.Error,
      index: -1,
      error: { message: t('task.emptyInstructions') },
    };
    this.cleanEffectFns = [];
  }

  on(event: ITaskExecutorEvent, callback: (...args: any[]) => void): void {
    this.emitter.on(event, callback);
  }

  off(event: ITaskExecutorEvent, callback?: (...args: any[]) => void): void {
    this.emitter.off(event, callback);
  }

  protected emit(event: ITaskExecutorEvent, ...args: any[]): void {
    this.emitter.emit(event, ...args);
  }

  protected initProvideTask(): ITaskExecutor {
    return {
      pause: this.pause.bind(this),
      resume: this.resume.bind(this),
      skip: this.skip.bind(this),
      stop: this.stop.bind(this),
      addCleanEffect: this.addCleanEffect.bind(this),
      on: this.on.bind(this),
      execute: this.execute.bind(this),
    };
  }

  execute(instructions: IInstructionSchema[]): Promise<ITaskResult> {
    if (!instructions.length) {
      return Promise.reject({
        status: 'error',
        index: -1,
        error: { message: t('task.emptyInstructions') },
      });
    }

    return new Promise(async (resolve, reject) => {
      this.executorInfo.instructions = instructions;
      this.executorInfo.currentIndex = 0;
      this.executorInfo.status = ExecutorStatus.Running;
      this.executorInfo.resolve = resolve;
      this.executorInfo.reject = reject;
      this.emit('start');
      await this.start();
    });
  }

  addCleanEffect(fn: () => void) {
    this.cleanEffectFns.push(fn);
  }
  clearCleanEffect() {
    this.cleanEffectFns.forEach((fn: () => void) => fn());
    this.cleanEffectFns = [];
  }

  protected async start(): Promise<void> {
    while (
      this.executorInfo.currentIndex < this.executorInfo.instructions.length &&
      this.executorInfo.status === ExecutorStatus.Running
    ) {
      const {
        instructions,
        currentIndex,
        status: executorStatus,
      } = this.executorInfo;
      const instruction = instructions[currentIndex];

      this.emit('beforeStep', {
        index: currentIndex,
        instruction,
      });

      const instructionExecutor = new Instruction(
        instruction,
        this.actionManager,
        this.context
      );

      const { status, result, error } = await instructionExecutor.execute();

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (status === ActionResultStatus.Success) {
        this.taskResult.result = result;
        this.taskResult.status = TaskResultStatus.PartialCompleted;

        // 暂停执行，并使暂停方法返回
        if (executorStatus === (ExecutorStatus.Paused as ExecutorStatus)) {
          this.executorInfo.pauseResolve?.();
          this.executorInfo.pauseResolve = null;
          this.executorInfo.waitPromise = null;
        }

        if (currentIndex === instructions.length - 1) {
          this.taskResult.status = TaskResultStatus.Success;
          // 最后一步点了暂停，等待恢复
          if (executorStatus !== (ExecutorStatus.Paused as ExecutorStatus)) {
            return this.finish();
          }
        }

        this.executorInfo.currentIndex++;
      } else {
        this.taskResult.error = error;
        this.taskResult.status = TaskResultStatus.Error;
        return this.finish();
      }
    }
  }

  finish(): void {
    const { instructions, currentIndex, resolve, reject } = this.executorInfo;
    const result: ITaskResult = {
      status: this.taskResult.status,
      index: currentIndex,
      instruction: instructions[currentIndex],
      ...(this.taskResult.status === TaskResultStatus.Error
        ? {
            error: this.taskResult.error as { message: string; stack?: string },
          }
        : { result: this.taskResult.result }),
    };

    if (this.taskResult.status === TaskResultStatus.Error) {
      reject?.(result);
    } else {
      resolve?.(result);
    }

    this.clearCleanEffect();
    this.initialize();
    this.emit('finish');
  }

  pause(): Promise<void> {
    this.emit('pause');
    this.executorInfo.status = ExecutorStatus.Paused;
    // 单个action执行无法中断，需要一个promise来等待
    if (this.executorInfo.waitPromise) {
      return this.executorInfo.waitPromise;
    }
    this.executorInfo.waitPromise = new Promise<void>((resolve) => {
      this.executorInfo.pauseResolve = resolve;
    });
    return this.executorInfo.waitPromise;
  }

  resume() {
    this.emit('resume');
    const { instructions, currentIndex } = this.executorInfo;
    if (currentIndex > instructions.length - 1) {
      this.finish();
    }
    this.executorInfo.status = ExecutorStatus.Running;
    this.start();
  }

  skip(): void {
    return this.startStep(this.executorInfo.currentIndex + 1);
  }

  startStep(index: number): void {
    const { status: executorStatus, instructions } = this.executorInfo;
    if (executorStatus !== ExecutorStatus.Paused) {
      return;
    }
    this.executorInfo.currentIndex = Math.min(index, instructions.length - 1);
  }

  async stop(): Promise<void> {
    if (this.executorInfo.status === ExecutorStatus.Running) {
      await this.pause();
    }
    this.finish();
  }
}
