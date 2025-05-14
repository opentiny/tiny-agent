import { Action } from '@opentiny/tiny-agent-task-runtime-service/types';

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
        error: { message: '未找到 Vue Router 实例' },
      };
    }
    try {
      await $router.push(to);
      return {
        status: 'success',
        result: { message: `成功跳转到 ${to}` },
      };
    } catch (error) {
      return {
        status: 'error',
        error: { message: `路由跳转失败: ${error}` },
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
        error: { message: '未找到 Vue Router 实例' },
      };
    }
    try {
      await $router.replace(to);
      return {
        status: 'success',
        result: { message: `成功替换路由到 ${to}` },
      };
    } catch (error) {
      return {
        status: 'error',
        error: { message: `路由替换失败: ${error}` },
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
        error: { message: '未找到 Vue Router 实例' },
      };
    }
    try {
      $router.back();
      return {
        status: 'success',
        result: { message: '成功后退' },
      };
    } catch (error) {
      return {
        status: 'error',
        error: { message: `后退失败: ${error}` },
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
        error: { message: '未找到 Vue Router 实例' },
      };
    }
    try {
      $router.forward();
      return {
        status: 'success',
        result: { message: '成功前进' },
      };
    } catch (error) {
      return {
        status: 'error',
        error: { message: `前进失败: ${error}` },
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
        error: { message: '未找到 Vue Router 实例' },
      };
    }
    try {
      $router.go(steps);
      return {
        status: 'success',
        result: { message: `成功前进或后退 ${steps} 步` },
      };
    } catch (error) {
      return {
        status: 'error',
        error: { message: `前进或后退失败: ${error}` },
      };
    }
  },
};

export default [push, replace, goBack, goForward, go];
