import type { IAction } from '@opentiny/tiny-agent-task-runtime-service';
import { findElement } from '../base-actions';
import { GuideModal } from './guide-modal';
import { t } from '../locale/i18n';

// 定义危险操作类型的枚举
enum UserGuideActionType {
  USER_GUIDE = 'userGuide',
}

// 危险操作
const userGuide: IAction = {
  name: UserGuideActionType.USER_GUIDE,
  execute: async (
    params: {
      selector: string;
      timeout?: number;
      title: string;
      text: string;
      tip: string;
    },
    context: any
  ) => {
    const { selector, timeout, title, text, tip } = params;
    const element = await findElement(selector, timeout);
    const guideModal = new GuideModal(element);
    guideModal.show({ title, text });
    const { pause } = context?.$task || {};
    const { tipToResume } = context?.$taskUI || {};
    pause && pause();

    guideModal.onHide(() => {
      tipToResume &&
        tipToResume.call(context?.$taskUI, tip || t('userGuideActions.tip'));
    });

    return { status: 'success' };
  },
};
export const GuideActions = [userGuide];
