import {
  BaseActions,
  FormActions,
  VueRouterActions,
  GuideActions,
  AxiosActions,
  TinyVueActions
} from '@opentiny/tiny-agent-task-action-lib';
import { createScheduler } from '@opentiny/tiny-agent-task-runtime-service';

// 创建调取器以及接入操作库
export const { taskScheduler, actionManager } = createScheduler(
  [
    ...BaseActions,
    ...FormActions,
    ...VueRouterActions,
    ...GuideActions,
    ...AxiosActions,
    ...TinyVueActions,
  ],
  {}
);
