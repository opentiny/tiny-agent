import type { ActionsResult, Instruction } from './types';
import ActionManager from './actionManager';
import EventEmitter from './eventEmitter';

// 执行器状态枚举
export enum ExecutorStatus {
  Idle = 'idle',
  Running = 'running',
  Paused = 'paused',
}

class ActionScheduler extends EventEmitter {
  private actionManager: ActionManager;
  private context: any;
  private instructions: Instruction[]; // 执行中的指令集
  private currentIndex: number;
  private status: ExecutorStatus;
  private resolve: (value: ActionsResult) => void;
  private reject: (value: ActionsResult) => void;
  private resultStatus: ActionsResult['status'];
  private finalResult: ActionsResult['result'];
  private pauseResolve: () => void;

  constructor() {
    super();
    this.context = { _clearEffect: [] };
    this.actionManager = new ActionManager();
  }

  provideContext(context: any) {
    this.context = {
      ...this.context,
      ...context,
      $scheduler: {
        pause: (...args) => this.pause(...args),
        resume: () => this.resume(),
      },
    };
  }

  registerAction(...args: any): void {
    this.actionManager.registerAction(...args);
  }

  registerActions(...args: any): void {
    this.actionManager.registerActions(...args);
  }

  execute(instructions: Instruction[]): Promise<ActionsResult> {
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
      this.start();
    });
  }

  async start(): Promise<ActionsResult> {
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
      try {
        console.log(`执行指令${this.currentIndex}:`, instruction);
        const { status, result, error } =
          await this.actionManager.executeAction(action, params, this.context);

        // 延迟等待1s，模拟异步操作，api-confirm指令不能延迟，否则接口返回会比执行早
        if (this.instructions[this.currentIndex + 1]?.name !== 'api-confirm') {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
        if (status === 'success') {
          this.finalResult = result;
          this.resultStatus = 'partial completed';

          // 暂停执行，并使暂停方法返回
          if (this.status === ExecutorStatus.Paused) {
            this.pauseResolve?.();
            this.pauseResolve = null;
          }

          if (this.currentIndex === this.instructions.length - 1) {
            this.resultStatus = status;
            // 最后一步点了暂停，等待恢复
            if (this.status !== ExecutorStatus.Paused) {
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
        this.finalResult = error;
        this.resultStatus = 'error';
        return this.finish();
      }
    }
  }

  finish() {
    if (this.resultStatus === 'error') {
      this.reject({
        status: this.resultStatus,
        index: this.currentIndex,
        instruction: this.instructions[this.currentIndex],
        error: this.finalResult,
      });
    } else {
      this.resolve({
        status: this.resultStatus,
        index: this.currentIndex,
        instruction: this.instructions[this.currentIndex],
        result: this.finalResult,
      });
    }
    this.emit('finish');
    this.context?._clearEffect.forEach((fn) => fn());

    if (this.context?._clearEffect) {
      this.context._clearEffect.length = 0;
    }
    this.instructions = null;
    this.currentIndex = null;
    this.status = ExecutorStatus.Idle;
    this.resolve = null;
    this.reject = null;
  }

  // 暂停执行
  pause(): void {
    this.emit('pause');
    this.status = ExecutorStatus.Paused;
    console.log(
      `执行器已暂停${this.currentIndex}`,
      this.instructions[this.currentIndex]
    );
  }

  waitPause(): Promise<void> {
    if (this.pauseResolve) {
      return this.waitPromise;
    }
    this.pause();
    this.waitPromise = new Promise<void>((resolve) => {
      this.pauseResolve = resolve;
    });
    return this.waitPromise;
  }

  // 恢复执行
  async resume(): Promise<ActionsResult> {
    this.emit('resume');
    if (this.currentIndex > this.instructions.length - 1) {
      return this.finish();
    }
    this.status = ExecutorStatus.Running;
    return this.start();
  }

  // 单步跳过
  skip(): Promise<ActionsResult> {
    this.startStep(this.currentIndex + 1);
  }

  startStep(index: number): Promise<ActionsResult> {
    if (this.status !== ExecutorStatus.Paused) {
      return Promise.reject(new Error('当前不处于暂停状态'));
    }
    this.currentIndex = Math.min(index, this.instructions.length - 1);
    console.log(
      `跳过到指令${this.currentIndex}:`,
      this.instructions[this.currentIndex]
    );
  }

  // 停止执行并返回结果
  async stop(): void {
    if (this.status === ExecutorStatus.running) {
      await this.waitPause();
    }
    this.finish();
  }
}

export default ActionScheduler;
