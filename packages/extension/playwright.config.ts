import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'popup.spec.ts',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  // Extension tests must run serially — one persistent context holds the extension
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  // Browser launched per-test in popup.spec.ts via chromium.launchPersistentContext
  // with --load-extension args. No projects block needed here.
});
