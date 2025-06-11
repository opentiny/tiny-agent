import type { IAction } from '@opentiny/tiny-agent-task-runtime-service';
import { t } from '../locale/i18n';

enum RouterActionType {
  VUE_ROUTER_PUSH = 'vueRouterPush',
  VUE_ROUTER_REPLACE = 'vueRouterReplace',
  VUE_ROUTER_GO_BACK = 'vueRouterGoBack',
  VUE_ROUTER_GO_FORWARD = 'vueRouterGoForward',
  VUE_ROUTER_GO = 'vueRouterGo',
}

// 路由跳转操作
const push: IAction = {
  name: RouterActionType.VUE_ROUTER_PUSH,
  execute: async (params: { to: string }, context: any) => {
    const { vueRouter } = context;
    const { to } = params;
    if (!vueRouter) {
      return {
        status: 'error',
        error: { message: t('vueRouterActions.errorMsg.instance') },
      };
    }
    try {
      await vueRouter.push(to);
      return {
        status: 'success',
        result: { message: t('vueRouterActions.successMsg.push', { to }) },
      };
    } catch (error) {
      return {
        status: 'error',
        error: {
          message: t('vueRouterActions.errorMsg.push', {
            error: JSON.stringify(error),
          }),
        },
      };
    }
  },
} as IAction;

// 路由替换操作
const replace: IAction = {
  name: RouterActionType.VUE_ROUTER_REPLACE,
  execute: async (params: { to: string }, context: any) => {
    const { vueRouter } = context;
    const { to } = params;
    if (!vueRouter) {
      return {
        status: 'error',
        error: { message: t('vueRouterActions.errorMsg.instance') },
      };
    }
    try {
      await vueRouter.replace(to);
      return {
        status: 'success',
        result: { message: t('vueRouterActions.successMsg.replace', { to }) },
      };
    } catch (error) {
      return {
        status: 'error',
        error: {
          message: t('vueRouterActions.errorMsg.replace', {
            error: JSON.stringify(error),
          }),
        },
      };
    }
  },
} as IAction;

// 后退操作
const goBack: IAction = {
  name: RouterActionType.VUE_ROUTER_GO_BACK,
  execute: (_params: Record<string, any>, context: any) => {
    const { vueRouter } = context;
    if (!vueRouter) {
      return {
        status: 'error',
        error: { message: t('vueRouterActions.errorMsg.instance') },
      };
    }
    try {
      vueRouter.back();
      return {
        status: 'success',
        result: { message: t('vueRouterActions.successMsg.goBack') },
      };
    } catch (error) {
      return {
        status: 'error',
        error: {
          message: t('vueRouterActions.errorMsg.goBack', {
            error: JSON.stringify(error),
          }),
        },
      };
    }
  },
};

// 前进操作
const goForward: IAction = {
  name: RouterActionType.VUE_ROUTER_GO_FORWARD,
  execute: (_params: Record<string, any>, context: any) => {
    const { vueRouter } = context;
    if (!vueRouter) {
      return {
        status: 'error',
        error: { message: t('vueRouterActions.errorMsg.instance') },
      };
    }
    try {
      vueRouter.forward();
      return {
        status: 'success',
        result: { message: t('vueRouterActions.successMsg.goForward') },
      };
    } catch (error) {
      return {
        status: 'error',
        error: {
          message: t('vueRouterActions.errorMsg.goForward', {
            error: JSON.stringify(error),
          }),
        },
      };
    }
  },
};

// 前进或后退指定步数操作
const go: IAction = {
  name: RouterActionType.VUE_ROUTER_GO,
  execute: (params: { steps: string }, context: any) => {
    const { vueRouter } = context;
    const { steps } = params;
    if (!vueRouter) {
      return {
        status: 'error',
        error: { message: t('vueRouterActions.errorMsg.instance') },
      };
    }
    try {
      vueRouter.go(steps);
      return {
        status: 'success',
        result: { message: t('vueRouterActions.successMsg.go', { steps }) },
      };
    } catch (error) {
      return {
        status: 'error',
        error: {
          message: t('vueRouterActions.errorMsg.go', {
            error: JSON.stringify(error),
          }),
        },
      };
    }
  },
} as IAction;

export const VueRouterActions = [push, replace, goBack, goForward, go];
