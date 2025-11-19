import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import type { Plugin } from 'vite';

const stubNodeModulesCssPlugin = (): Plugin => ({
  name: 'stub-node-modules-css',
  enforce: 'pre',
  transform(_code: string, id: string) {
    if (id.endsWith('.css') && id.includes('/node_modules/')) {
      return {
        code: 'export default {};',
        map: null,
      };
    }

    return null;
  },
});

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
    server: {
      deps: {
        inline: ['@mui/x-data-grid'],
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
  plugins: [stubNodeModulesCssPlugin()],
});
