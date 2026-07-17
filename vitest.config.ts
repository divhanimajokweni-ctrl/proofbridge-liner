import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/prover': path.resolve(__dirname, 'prover'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/utils': path.resolve(__dirname, 'utils'),
      '@/server': path.resolve(__dirname, 'server'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.ts', 'contracts/**/__tests__/**/*.test.ts'],
    exclude: ['**/node_modules/**', 'dist', '.next', 'tests/property/**'],
  },
});
