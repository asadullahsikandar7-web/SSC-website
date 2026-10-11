import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./api/tests/setup.ts'],
    include: ['api/tests/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 30000,
  },
});
