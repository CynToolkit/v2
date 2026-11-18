import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
    // Some bootstrap/process-tree tests intentionally wait longer than vitest's 5s default.
    testTimeout: 120_000,
    hookTimeout: 30_000,
  },
});
