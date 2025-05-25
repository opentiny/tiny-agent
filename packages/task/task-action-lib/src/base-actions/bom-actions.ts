import { Action } from '@opentiny/tiny-agent-task-runtime-service/types';

enum BrowserActionType {
  GO_BACK = 'goBack',
  GO_FORWARD = 'goForward',
}

const goBack: Action = {
  name: BrowserActionType.GO_BACK,
  execute: () => {
    window.history.back();
    return {
      status: 'success',
    };
  },
};

const goForward: Action = {
  name: BrowserActionType.GO_FORWARD,
  execute: () => {
    window.history.forward();
    return {
      status: 'success',
    };
  },
};

export const BomActions = [goBack, goForward];
