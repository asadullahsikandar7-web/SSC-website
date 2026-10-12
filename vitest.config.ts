import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./server/tests/setup.ts'],
    include: ['server/tests/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 30000,
  },
});
