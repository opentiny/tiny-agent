import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import packageJson from './package.json';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      name: 'task-runtime-service',
      fileName: 'index',
    },
    sourcemap: true,
    rollupOptions: {
      external: Object.keys(packageJson.dependencies || {}),
    },
  },
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
    }),
    cssInjectedByJsPlugin(),
  ],
});
