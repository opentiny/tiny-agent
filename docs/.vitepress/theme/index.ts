import DefaultTheme from 'vitepress/theme';
import '@opentiny/tiny-robot/dist/style.css';

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    // 仅在客户端环境执行
    if (typeof window !== 'undefined') {
      import('@opentiny/vue').then((m) => {
        app.use(m.default);
      });

      import('@opentiny/tiny-robot').then((m) => {
        app.use(m.default);
      });
    }
  },
};
