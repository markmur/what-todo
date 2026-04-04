import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "e2e",
  timeout: 15000,
  retries: 0,
  use: {
    baseURL: "http://localhost:5199",
    headless: true
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" }
    }
  ],
  webServer: {
    command: "pnpm dev --port 5199",
    port: 5199,
    reuseExistingServer: !process.env.CI
  }
})
