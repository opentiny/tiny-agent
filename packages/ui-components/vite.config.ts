import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      name: 'ui-components',
      fileName: 'index',
    },
    sourcemap: true,
    rollupOptions: {
      external: ['@floating-ui/dom'],
    },
  },
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
    }),
  ],
});
