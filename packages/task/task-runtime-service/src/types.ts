export interface IInstruction {
  action: string;
  params: { [key: string]: any };
}

export interface ITask {
  id: string;
  instructions: IInstruction[];
}

export type Action = {
  name: string;
  execute: (
    params: { [key: string]: any },
    context?: any
  ) => IActionResult | Promise<IActionResult>;
};

export interface IActionResult {
  status: 'success' | 'error' | 'partial completed';
  result?: { [key: string]: any };
  error?: { message: string; stack?: string };
}

export type ActionsResult = IActionResult & {
  index: number;
  instruction: IInstruction;
};

export type TaskResult = ActionsResult & { id: string };

export interface ISchedulerContext {
  _clearEffect: Array<() => void>;
  $scheduler?: {
    pause: (...args: unknown[]) => void;
    resume: () => Promise<void>;
  };
  [key: string]: any;
}

export interface IScheduler {
  registerActions: (actions: Action[]) => void;
  registerAction: (action: Action) => void;
  provideContext: (context: ISchedulerContext) => void;
  install: () => void;
}
