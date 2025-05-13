import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
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
      external: ['@opentiny/tiny-agent-task-action-lib'],
    },
  },
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
    }),
  ],
});
