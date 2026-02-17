// vitest.config.ts
import { defineConfig, configDefaults } from 'vitest/config'; // Import configDefaults
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    exclude: [
      ...configDefaults.exclude, 
      'tests/e2e/**',       // Ignore Playwright E2E tests
      'playwright.config.ts' // Ignore the config file itself
    ],
  },
});