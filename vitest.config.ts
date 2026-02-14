import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './') },
  },
  test: {
    coverage: {
      exclude: ['db/schema/**'],
      provider: 'v8',
      reporter: ['text', 'text-summary'],
    },
    exclude: ['**/node_modules/**', '**/dist/**', '**/electron-dist/**'],
    globals: true,
    include: ['lib/**/__tests__/**/*.test.ts', 'electron/**/__tests__/**/*.test.ts'],
  },
});
