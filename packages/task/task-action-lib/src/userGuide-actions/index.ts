import { Action } from '../common/action.d';
import { findElement } from '../common';
import GuideModal from './GuideModal';
import { executeExpect } from './Expect';

// 定义危险操作类型的枚举
enum UserGuideActionType {
  USER_GUIDE = 'userGuide',
  EXPECT = 'expect',
  EXECUTE_CODE = 'executeCode'
}

// 危险操作
const UserGuide: Action = {
  name: UserGuideActionType.USER_GUIDE,
  execute: async (params, context) => {
    const { selector, timeout, title, text } = params;
    const element = await findElement(selector, timeout);
    const guideModal = new GuideModal(element);
    guideModal.show({ title, text });

    return new Promise((resolve) => {
      guideModal.onHide(() => {
        const pause = context?.$scheduler?.pause;
        pause && pause();
        resolve({ status: 'success' });
      });
    });
  },
};

const ExecuteCode: Action = {
  name: UserGuideActionType.EXECUTE_CODE,
  execute: async (params, context) => {
    const { code, codeParams } = params;
    if (typeof code!== 'string') {
      throw new Error('传入的代码必须是字符串');
    }

    try {
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

// expect action
const Expect: Action = {
  name: UserGuideActionType.EXPECT,
  execute: executeExpect,
};

export default [UserGuide, ExecuteCode, Expect];