import { defineConfig } from "@playwright/test";

// Electron startup smoke: one test against the packaged app. Manual-only, not part of CI.
// Run with `pnpm smoke:electron:manual` (builds and packages first) or
// `pnpm smoke:electron:run` (reuses an existing package).
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 120_000,
  workers: 1,
  retries: 0,
  reporter: "list",
});
