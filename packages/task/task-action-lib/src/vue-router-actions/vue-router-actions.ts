import { Action } from '@opentiny/tiny-agent-task-runtime-service/types';
import { t } from '../locale/i18n';

// 定义路由操作类型的枚举，添加 vue_ 前缀区分
enum RouterActionType {
  VUE_PUSH = 'vue_push',
  VUE_REPLACE = 'vue_replace',
  VUE_GO_BACK = 'vue_goBack',
  VUE_GO_FORWARD = 'vue_goForward',
  VUE_GO = 'vue_go',
}

// 路由跳转操作
const push: Action = {
  name: RouterActionType.VUE_PUSH,
  execute: async (params, context) => {
    const { $router } = context;
    const { to } = params;
    if (!$router) {
      return {
        status: 'error',
        error: { message: t('vueRouterActions.errorMsg.instance') },
      };
    }
    try {
      await $router.push(to);
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
};

// 路由替换操作
const replace: Action = {
  name: RouterActionType.VUE_REPLACE,
  execute: async (params, context) => {
    const { $router } = context;
    const { to } = params;
    if (!$router) {
      return {
        status: 'error',
        error: { message: t('vueRouterActions.errorMsg.instance') },
      };
    }
    try {
      await $router.replace(to);
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
};

// 后退操作
const goBack: Action = {
  name: RouterActionType.VUE_GO_BACK,
  execute: (params, context) => {
    const { $router } = context;
    if (!$router) {
      return {
        status: 'error',
        error: { message: t('vueRouterActions.errorMsg.instance') },
      };
    }
    try {
      $router.back();
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
const goForward: Action = {
  name: RouterActionType.VUE_GO_FORWARD,
  execute: (params, context) => {
    const { $router } = context;
    if (!$router) {
      return {
        status: 'error',
        error: { message: t('vueRouterActions.errorMsg.instance') },
      };
    }
    try {
      $router.forward();
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
const go: Action = {
  name: RouterActionType.VUE_GO,
  execute: (params, context) => {
    const { $router } = context;
    const { steps } = params;
    if (!$router) {
      return {
        status: 'error',
        error: { message: t('vueRouterActions.errorMsg.instance') },
      };
    }
    try {
      $router.go(steps);
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
};

export const VueRouterActions = [push, replace, goBack, goForward, go];
