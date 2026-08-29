var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
import { defineConfig, devices } from "@playwright/test";
var stdin_default = defineConfig({
  testDir: "./tests/e2e",
  timeout: 6e4,
  expect: { timeout: 15e3 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "playwright-report" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15e3,
    navigationTimeout: 3e4
  },
  projects: [
    {
      name: "chromium",
      use: __spreadValues({}, devices["Desktop Chrome"])
    }
  ],
  webServer: process.env.E2E_NO_WEBSERVER ? void 0 : {
    command: "bun run dev",
    url: "http://localhost:3000",
    timeout: 12e4,
    reuseExistingServer: true,
    stdout: "pipe",
    stderr: "pipe"
  }
});
export {
  stdin_default as default
};
