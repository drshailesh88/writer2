import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.TEST_PORT ?? "3001";
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 3,
  timeout: 30000,
  expect: { timeout: 10000 },
  reporter: "html",
  globalSetup: "./tests/global-setup.ts",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `${baseURL}/api/ping`,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
