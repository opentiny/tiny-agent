import { defineConfig } from 'vitepress'
import { vitepressDemoPlugin } from 'vitepress-demo-plugin'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "TinyAgent",
  description: "A VitePress Site",
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
      open: true,      // 开发时自动打开浏览器
    },
  },
  themeConfig: {
    logo: '/logo.svg',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '指引', link: '/guide/write-docs-guide' },
      { text: '配置', link: '/config/config' },
      { text: '插件', link: '/plugins/simulate-lib' },
      { text: '演示', link: '/examples/demo' },
      { text: '1.0.0', link: '/releases/releases', },
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
      '/config/': [
        {
          text: '配置',
          base: '/config/',
          items: [
            { text: '配置方案', link: 'config' },
          ],
        },
      ],
      '/plugins/': [
        {
          text: '插件',
          base: '/plugins/',
          items: [
            { text: '模拟dom操作库', link: 'simulate-lib' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/opentiny/tiny-agent' }
    ]
  }
})
