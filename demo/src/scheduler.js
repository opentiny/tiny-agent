import {
  DomActions,
  FormActions,
  VueRouterActions,
  GuideActions,
  AxiosActions,
} from '@opentiny/tiny-agent-task-action-lib';
import { createScheduler } from '@opentiny/tiny-agent-task-runtime-service';

// 创建调取器以及接入操作库
export const { taskScheduler, actionManager } = createScheduler(
  [
    ...DomActions,
    ...FormActions,
    ...VueRouterActions,
    ...GuideActions,
    ...AxiosActions,
  ],
  {}
);
