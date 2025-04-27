import { Action } from '../common/action.d';
import { findElement } from '../common';
import { simulateClick } from '../dom-actions/dom-simulate';
import GuideModal from './GuideModal';

// 定义危险操作类型的枚举
enum UserGuideActionType {
  USER_GUIDE = 'userGuide',
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
        const pause = context?.$scheduler.pause;
        pause && pause();
        resolve({ status: 'success' });
      });
    });
  },
};
export default [UserGuide];
