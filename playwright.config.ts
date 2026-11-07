import { defineConfig } from '@playwright/test';
const baseURL=process.env.PLAYWRIGHT_BASE_URL??'http://localhost:3000';
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, timeout: 45000,
  expect: { timeout: 10000 }, reporter: [['list'], ['html',{open:'never'}]],
  use: { baseURL, headless: true, channel: process.env.PLAYWRIGHT_CHANNEL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: `${process.platform==='win32'?'npm.cmd':'npm'} run dev`, url: baseURL, reuseExistingServer: true, timeout: 120000 }
});
