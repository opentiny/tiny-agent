import { defineConfig } from 'vitepress';
import { vitepressDemoPlugin } from 'vitepress-demo-plugin';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'TinyAgent',
  description: 'A VitePress Site',
  srcDir: 'src',
  outDir: 'dist',
  base: '/docs/tiny-agent/',
  ignoreDeadLinks: true,
  markdown: {
    config(md) {
      md.use(vitepressDemoPlugin);
    },
  },
  vite: {
    server: {
      host: '0.0.0.0', // 允许外部访问
      open: true, // 开发时自动打开浏览器
    },
  },
  themeConfig: {
    logo: '/logo.svg',
    outline: {
      level: [2, 3], // 显示 <h2> 和 <h3> 标题
      label: '目录', // 可选，自定义目录标题
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '指引', link: '/guide/write-docs-guide' },
      { text: '配置', link: '/config/config' },
      { text: 'API', link: '/api/api' },
      { text: '扩展', link: '/extensions/extension' },
      { text: '演示', link: '/examples/demo' },
      { text: '1.0.0', link: '/releases/releases' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '指引',
          base: '/guide/',
          items: [
            { text: '开发指引', link: 'develop' },
            { text: '部署流程', link: 'deploy' },
            { text: '如何使用', link: 'use' },
            { text: '如何写文章', link: 'write-docs-guide' },
          ],
        },
      ],
      '/api/': [
        {
          text: '调度器',
          base: '/api/schedular/',
          items: [
            { text: 'Task', link: 'task' },
            { text: 'ActionManager', link: 'action-manager' },
            { text: 'TaskScheduler', link: 'task-scheduler' },
            { text: 'TaskUI', link: 'task-ui' },
          ],
        },
        {
          text: '操作库',
          base: '/api/actions/',
          items: [
            { text: 'Actions概述', link: 'simulate-lib' },
            { text: 'BaseActions', link: 'base-actions' },
            { text: 'FormActions', link: 'form-actions' },
            { text: 'TinyVueActions', link: 'tiny-vue-actions' },
            { text: 'VueRouterActions', link: 'vue-router-actions' },
            { text: 'UserGuideActions', link: 'user-guide-actions' },
          ],
        },
        {
          text: '基础UI库',
          base: '/api/ui/',
          items: [
            { text: 'Tooltip', link: 'tooltip' },
            { text: 'Popup', link: 'popup' },
          ],
        },
      ],
      '/config/': [
        {
          text: '配置',
          base: '/config/',
          items: [{ text: '配置方案', link: 'config' }],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/opentiny/tiny-agent' },
    ],
    search: {
      provider: 'local',
    },
  },
});
