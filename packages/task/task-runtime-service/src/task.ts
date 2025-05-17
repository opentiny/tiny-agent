import type {
  Action,
  ActionsResult,
  IInstruction,
  ISchedulerContext,
} from './types';
import ActionManager from './action-manager';
import EventEmitter from './event-emitter';

// 执行器状态枚举
export enum ExecutorStatus {
  Idle = 'idle',
  Running = 'running',
  Paused = 'paused',
}

export class Task extends EventEmitter {
  private actionManager: ActionManager;
  private context: ISchedulerContext;
  private instructions: IInstruction[] = []; // 执行中的指令集
  private currentIndex: number = 0;
  private status: ExecutorStatus = ExecutorStatus.Idle; // 执行器状态
  private resolve: ((value: ActionsResult) => void) | null = null; // 成功回调
  private reject: ((value: ActionsResult) => void) | null = null; // 失败回调
  private resultStatus: ActionsResult['status'] = 'error'; // 结果状态
  private finalResult: ActionsResult['result']; // 最后结果
  private pauseResolve: (() => void) | null = null;
  private waitPromise: Promise<void> | null = null;
  private cleanEffectFns: (() => void)[] = [];

  constructor(actionManager: ActionManager, context: ISchedulerContext) {
    super();
    this.context = {
      ...context,
      $task: {
        pause: (...args: unknown[]) => this.pause(...args),
        resume: () => this.resume(),
        addCleanEffect: (fn: () => void) => this.addCleanEffect(fn),
      },
    };
    this.actionManager = actionManager;
  }

  execute(instructions: IInstruction[]): Promise<ActionsResult> {
    if (!instructions.length) {
      return Promise.reject({
        status: 'error',
        index: -1,
        error: { message: '指令列表为空' },
      });
    }

    return new Promise(async (resolve, reject) => {
      this.instructions = instructions;
      this.currentIndex = 0;
      this.status = ExecutorStatus.Running;
      this.resolve = resolve;
      this.reject = reject;
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

  initialize() {
    this.instructions = [];
    this.currentIndex = 0;
    this.status = ExecutorStatus.Idle;
    this.resolve = null;
    this.reject = null;
    this.resultStatus = 'error';
    this.finalResult = undefined;
    this.pauseResolve = null;
    this.waitPromise = null;
    this.cleanEffectFns = [];
  }

  async start(): Promise<void> {
    while (
      this.currentIndex < this.instructions.length &&
      this.status === ExecutorStatus.Running
    ) {
      const instruction = this.instructions[this.currentIndex];
      const { action, params } = instruction;
      this.emit('beforeStep', {
        index: this.currentIndex,
        instruction,
      });
      const actionExecutor = this.actionManager.findAction(action)?.execute;
      if (!actionExecutor) {
        this.finalResult = { message: `未找到名为 '${action}' 的ACTION` };
        this.resultStatus = 'error';
        return this.finish();
      }
      try {
        const { status, result, error } = await actionExecutor(
          params,
          this.context
        );

        // 延迟等待200ms，使每个action之间有停顿
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (status === 'success') {
          this.finalResult = result;
          this.resultStatus = 'partial completed';

          // 暂停执行，并使暂停方法返回
          if (this.status === (ExecutorStatus.Paused as ExecutorStatus)) {
            this.pauseResolve?.();
            this.pauseResolve = null;
            this.waitPromise = null;
          }

          if (this.currentIndex === this.instructions.length - 1) {
            this.resultStatus = status;
            // 最后一步点了暂停，等待恢复
            if (this.status !== (ExecutorStatus.Paused as ExecutorStatus)) {
              return this.finish();
            }
          }

          this.currentIndex++;
        } else {
          this.finalResult = error;
          this.resultStatus = 'error';
          return this.finish();
        }
      } catch (error) {
        this.finalResult = error as { message: string; stack?: string };
        this.resultStatus = 'error';
        return this.finish();
      }
    }
  }

  finish(): void {
    const result: ActionsResult = {
      status: this.resultStatus,
      index: this.currentIndex,
      instruction: this.instructions[this.currentIndex],
      ...(this.resultStatus === 'error'
        ? { error: this.finalResult as { message: string; stack?: string } }
        : { result: this.finalResult }),
    };

    if (this.resultStatus === 'error') {
      this.reject?.(result);
    } else {
      this.resolve?.(result);
    }

    this.clearCleanEffect();
    this.initialize();
    this.emit('finish');
  }

  pause(...args: unknown[]): void {
    this.emit('pause');
    this.status = ExecutorStatus.Paused;
  }

  // 单个action执行无法中断，需要一个promise来等待
  waitPause(): Promise<void> {
    if (this.waitPromise) {
      return this.waitPromise;
    }
    this.pause();
    this.waitPromise = new Promise<void>((resolve) => {
      this.pauseResolve = resolve;
    });
    return this.waitPromise;
  }

  async resume(): Promise<void> {
    this.emit('resume');
    if (this.currentIndex > this.instructions.length - 1) {
      this.finish();
    }
    this.status = ExecutorStatus.Running;
    this.start();
  }

  skip(): void {
    return this.startStep(this.currentIndex + 1);
  }

  startStep(index: number): void {
    if (this.status !== ExecutorStatus.Paused) {
      return;
    }
    this.currentIndex = Math.min(index, this.instructions.length - 1);
  }

  // 停止执行并返回结果
  async stop(): Promise<void> {
    if (this.status === ExecutorStatus.Running) {
      await this.waitPause();
    }
    this.finish();
  }
}
