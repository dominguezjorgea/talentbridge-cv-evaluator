import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 180_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  outputDir: './test/screenshots',
  reporter: [['html', { open: 'never' }], ['list']],
});
