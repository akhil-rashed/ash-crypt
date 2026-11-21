import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "browser.spec.ts",
  fullyParallel: true,
  workers: 3,
  timeout: 30000,
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 1440, height: 960 },
    headless: true,
    trace: "retain-on-failure",
  },
  reporter: "list",
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
