import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    headless: true,
  },
  webServer: {
    command: process.env.PNPM ? "pnpm dev" : (process.env.YARN ? "yarn dev" : "npm run dev"),
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
