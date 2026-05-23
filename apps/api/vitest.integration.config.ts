import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.integration.spec.ts', 'test/**/*.integration.spec.ts'],
    // Integration tests run against a real Supabase test branch
    // Set SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_KEY in CI
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@ims/types': path.resolve(__dirname, '../../packages/types/src'),
      '@ims/validators': path.resolve(__dirname, '../../packages/validators/src'),
    },
  },
});
