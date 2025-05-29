import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import packageJson from './package.json';
export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    sourcemap: true,
    rollupOptions: {
      external: [
        ...Object.keys(packageJson.dependencies || {}),
        ...[
          'node:http'
        ]
      ]
    },
  },
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
    }),
  ],
});
