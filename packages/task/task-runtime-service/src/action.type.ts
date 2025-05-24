export interface IActionContext {
  [key: string]: any;
}

export interface IAction {
  name: string;
  execute: (
    params: { [key: string]: any },
    context: IActionContext
  ) => IActionResult | Promise<IActionResult>;
}

export interface IActionResult {
  status: 'success' | 'error' | 'partial completed';
  result?: { [key: string]: any };
  error?: { message: string; stack?: string };
}
export interface IActionResult {
  status: 'success' | 'error' | 'partial completed';
  result?: { [key: string]: any };
  error?: { message: string; stack?: string };
}
