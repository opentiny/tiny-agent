export type IActionContext = Record<string, any>;

export enum ActionResultStatus {
  Success = 'success',
  Error = 'error',
}

export interface IAction {
  name: string;
  execute: (params: Record<string, any>, context?: IActionContext) => IActionResult | Promise<IActionResult>;
  description?: string;
}

export interface IActionResult {
  status: 'success' | 'error';
  result?: Record<string, any>;
  error?: { message: string; stack?: string };
}
