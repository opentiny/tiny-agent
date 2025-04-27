interface ActionResult {
  status: 'success' | 'error';
  result?: { [key: string]: any };
  error?: { [key: string]: any };
}

export type ActionExecute =  (
  params: { [key: string]: any },
  context?: any
) => ActionResult | Promise<ActionResult>;

export type Action = {
  name: string;
  description?: string;
  execute: ActionExecute;
};
