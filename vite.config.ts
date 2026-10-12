import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['server/tests/**'],
    setupFiles: './vitest.setup.ts',
    testTimeout: 20000,
  },
});
