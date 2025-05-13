interface Result {
  status: 'success' | 'error';
  result?: { [key: string]: any };
  error?: { [key: string]: any };
}

export type Action = {
  name: string;
  description?: string;
  execute: (
    params: { [key: string]: any },
    context?: any
  ) => Result | Promise<Result>;
};
