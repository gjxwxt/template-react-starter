const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: /smoke\.spec\.cjs/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['line']],
  use: {
    headless: true,
    viewport: { width: 1536, height: 960 },
    baseURL: 'http://127.0.0.1:5175',
  },
  webServer: {
    command: 'corepack pnpm dev',
    url: 'http://127.0.0.1:5175',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
