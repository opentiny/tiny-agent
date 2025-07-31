import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import packageJson from './package.json';
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
      output: {
        banner: 'import "./index.css";',
      },
      external: Object.keys(packageJson.dependencies || {}),
    },
  },
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
    }),
  ],
});
