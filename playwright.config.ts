import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for VVU-IVE fail-closed valve E2E.
 *
 * Base URL points at the local Next.js dev server. The E2E test walks
 * the Section 9 "End-to-End Test Walk" — clicks All GO, verifies the
 * WebGL morph to Miles (stage 3), trips a breaker via the API, and
 * asserts the UI drops back to pulsing-red INCONCLUSIVE.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "playwright-report" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : {
        command: "bun run dev",
        url: "http://localhost:3000",
        timeout: 120_000,
        reuseExistingServer: true,
        stdout: "pipe",
        stderr: "pipe",
      },
});
