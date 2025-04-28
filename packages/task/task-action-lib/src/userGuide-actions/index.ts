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
    const { selector, timeout, title, text, type } = params;
    const element = await findElement(selector, timeout);
    const guideModal = new GuideModal(element);
    guideModal.show({ title, text });
    const { pause, resume } = context?.$scheduler || {};
    const { tipToResume } = context?.$ui || {};
    pause && pause();

    if (type === 'click') {
      element.addEventListener(
        'click',
        () => {
          guideModal.hide();
          resume && resume();
        },
        { once: true }
      );
    }

    guideModal.onHide(() => {
      tipToResume && tipToResume();
    });

    return { status: 'success' };
    // return new Promise((resolve) => {
    //   guideModal.onHide(() => {
    //   });
    // });
  },
};
export default [UserGuide];
