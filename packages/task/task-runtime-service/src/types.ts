export interface IInstruction {
  action: string;
  params: { [key: string]: any };
}

export interface ITaskDescription {
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
