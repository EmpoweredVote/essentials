import { defineConfig, devices } from '@playwright/test';
import { PREVIEW_PORT, QA_USER_AGENT } from './e2e/constants.js';

const baseURL = `http://localhost:${PREVIEW_PORT}`;

// Browser journeys: the PR's own build, served by `vite preview`, talking to
// the live API through the preview proxy. See e2e/ and CLAUDE.md.
export default defineConfig({
  testDir: './e2e',
  // Room for two pages at the 15 s limit (see e2e/support.js), so a slow
  // page fails with its own plain message, not a generic timeout.
  timeout: 60_000,
  // A user's main content must show within 5 s.
  expect: { timeout: 5_000 },
  retries: process.env.CI ? 1 : 0,
  // One browser at a time. The journeys read the live API, which real users
  // share; parallel workers measurably slowed it (profiles past 15 s locally).
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI
    ? [['list'], ['github'], ['html', { open: 'never' }]]
    : [['list']],
  globalSetup: './e2e/global-setup.js',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        userAgent: `${devices['Desktop Chrome'].userAgent} ${QA_USER_AGENT}`,
      },
    },
    {
      name: 'phone',
      grep: /@phone/,
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 812 },
        userAgent: `${devices['Pixel 5'].userAgent} ${QA_USER_AGENT}`,
      },
    },
  ],
  webServer: {
    command: 'npm run e2e:serve',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
