import type { IAction } from '@opentiny/tiny-agent-task-runtime-service';

enum BrowserActionType {
  GO_BACK = 'goBack',
  GO_FORWARD = 'goForward',
}

const goBack: IAction = {
  name: BrowserActionType.GO_BACK,
  execute: () => {
    window.history.back();
    return {
      status: 'success',
    };
  },
};

const goForward: IAction = {
  name: BrowserActionType.GO_FORWARD,
  execute: () => {
    window.history.forward();
    return {
      status: 'success',
    };
  },
};

export const BomActions = [goBack, goForward];
