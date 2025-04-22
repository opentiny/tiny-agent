import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // 路径别名（可选，方便导入）
    },
  },
  build: {
    target: 'esnext', // 编译为最新 ES 语法（浏览器兼容）
    manifest: false, // 不生成 manifest 文件（可选）
    sourcemap: true,
    rollupOptions: {
      output: {
        // 按需配置输出格式（默认已处理 ES 模块）
      },
    },
  },
});
