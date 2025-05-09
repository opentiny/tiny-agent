export interface Instruction {
  action: string;
  params: { [key: string]: any };
}

export interface Task {
  id: string;
  instructions: Instruction[];
}

export type Action = {
  name: string;
  execute: (
    params: { [key: string]: any },
    context?: any
  ) => ActionResult | Promise<ActionResult>;
};

export interface ActionResult {
  status: 'success' | 'error' | 'partial completed';
  result?: { [key: string]: any };
  error?: { message: string; stack?: string };
}

export type ActionsResult = ActionResult & {
  index: number;
  instruction: Instruction;
};

export type TaskResult = ActionsResult & { id: string };

export interface SchedulerContext {
  _clearEffect: Array<() => void>;
  $scheduler?: {
    pause: (...args: unknown[]) => void;
    resume: () => Promise<void>;
  };
  [key: string]: any;
}

export interface Scheduler {
  registerActions: (actions: Action[]) => void;
  registerAction: (action: Action) => void;
  provideContext: (context: SchedulerContext) => void;
  install: () => void;
}
