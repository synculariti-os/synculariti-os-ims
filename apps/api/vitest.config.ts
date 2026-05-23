import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.spec.ts'],
    exclude: ['src/**/__tests__/**/*.integration.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/**/*.module.ts', 'src/main.ts'],
      thresholds: {
        branches: 80,
        lines: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@ims/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@ims/validators': path.resolve(__dirname, '../../packages/validators/src/index.ts'),
    },
  },
});
