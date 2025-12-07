import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Run tests in files in parallel (WAL mode enabled, safe for concurrent access) */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Use 2 workers on CI for 2x speedup (WAL mode supports concurrency) */
  workers: process.env.CI ? 2 : undefined,

  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  /* Global setup - run once before all tests */
  globalSetup: './tests/e2e/global-setup.ts',

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',

    /* Run headless by default */
    headless: true
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/chart-visual-parity.spec.ts'
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: '**/chart-visual-parity.spec.ts'
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: '**/chart-visual-parity.spec.ts'
    },

    /* Test against mobile viewports */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testIgnore: '**/chart-visual-parity.spec.ts'
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testIgnore: '**/chart-visual-parity.spec.ts'
    },

    /* Visual parity tests - chromium only with 2x scale */
    {
      name: 'visual-parity',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 2
      },
      testMatch: '**/chart-visual-parity.spec.ts'
    }
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000, // 60 seconds for dev server startup
    stdout: 'pipe', // Show server output in test logs
    stderr: 'pipe', // Show server errors in test logs
    env: {
      JWT_SECRET: 'test-secret-for-e2e-only-do-not-use-in-production'
    }
  }
})
