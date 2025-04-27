import { Action } from '../common/action.d';

// 定义执行用户代码的 Action 类型
enum ExecuteCodeActionType {
  EXECUTE_CODE = 'executeCode',
}

// 执行用户代码的 Action
const ExecuteCode: Action = {
  name: ExecuteCodeActionType.EXECUTE_CODE,
  execute: async (params, context) => {
    const { code, codeParams } = params;
    if (typeof code !== 'string') {
      throw new Error('传入的代码必须是字符串');
    }

    try {
      // 使用 Function 构造函数执行代码，并传递参数
      const func = new Function('context', 'params', code);
      const result = await func(context, codeParams);
      return {
        status: 'success',
        result: { data: result },
      };
    } catch (error) {
      throw new Error(`执行用户代码时出错: ${error}`);
    }
  },
};

export default [ExecuteCode];
