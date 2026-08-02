import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173'
const testsLiveSite = Boolean(process.env.PLAYWRIGHT_BASE_URL)

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './output/playwright/test-results',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL,
    browserName: 'chromium',
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    colorScheme: 'light',
    locale: 'zh-CN',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-edge',
      use: { ...devices['Desktop Edge'] },
    },
    {
      name: 'mobile-360',
      use: {
        viewport: { width: 360, height: 800 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: testsLiveSite
    ? undefined
    : {
        command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
})
