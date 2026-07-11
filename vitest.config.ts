import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/__tests__/**/*.test.ts'],
    exclude: ['**/node_modules/**', 'dist', '.next', 'tests/property/**'],
  },
});
