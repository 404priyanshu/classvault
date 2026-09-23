import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT || 3100)
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: 'signed-in/**',
      use: { ...devices['Desktop Chrome'] },
    },
    // Signed-in journeys need the local Supabase stack (npm run
    // local:bootstrap) and a build made against it, so they only run when
    // asked for: npm run test:e2e:signed-in.
    ...(process.env.E2E_SIGNED_IN
      ? [
          {
            name: 'signed-in',
            testDir: './e2e/signed-in',
            use: { ...devices['Desktop Chrome'] },
          },
        ]
      : []),
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    // Roadmaps under test use the deterministic generator. A GEMINI_API_KEY in
    // .env.local would otherwise send test notes to Google on every run; an
    // explicitly empty value wins over .env.local and switches it off.
    env: { GEMINI_API_KEY: '' },
    timeout: 60_000,
  },
})
