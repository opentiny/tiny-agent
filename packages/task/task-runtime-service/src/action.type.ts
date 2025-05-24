export interface IActionContext {
  [key: string]: any;
}

export enum ActionResultStatus {
  Success = 'success',
  Error = 'error',
}

export interface IAction {
  name: string;
  execute: (
    params: { [key: string]: any },
    context: IActionContext
  ) => IActionResult | Promise<IActionResult>;
}

export interface IActionResult {
  status: ActionResultStatus;
  result?: { [key: string]: any };
  error?: { message: string; stack?: string };
}
