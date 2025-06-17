import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import packageJson from './package.json';

export default defineConfig({
  build: {
    target: 'node22',
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'cjs'],
      fileName: 'index',
    },
    sourcemap: true,
    rollupOptions: {
      external: [...Object.keys(packageJson.dependencies || {}), ...['node:stream', 'node:crypto']],
    },
  },
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [],
    },
  },
});
