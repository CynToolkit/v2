import { existsSync } from "node:fs";
import { expect, test } from "vitest";
import { CONSTRUCT_WEBGL_ARGS } from "./export-shared";

/**
 * Construct cannot start without WebGL (issue #34). This launches the real Playwright Chromium
 * with the export's launch args and requires a WebGL context. It is skipped when no browser is
 * installed locally; CI installs one so GPU-less macOS/Windows runners are covered.
 */
async function loadChromium() {
  try {
    const { chromium } = await import("playwright");
    return existsSync(chromium.executablePath()) ? chromium : undefined;
  } catch {
    return undefined;
  }
}

const chromium = await loadChromium();

test.skipIf(!chromium)(
  "Chromium launched with the Construct export args can create a WebGL context",
  async () => {
    const browser = await chromium!.launch({ headless: true, args: CONSTRUCT_WEBGL_ARGS });
    try {
      const page = await browser.newPage();
      const renderer = await page.evaluate(() => {
        const gl = document.createElement("canvas").getContext("webgl");
        return gl ? String(gl.getParameter(gl.VERSION)) : null;
      });
      expect(renderer).toMatch(/WebGL/);
    } finally {
      await browser.close();
    }
  },
  60_000,
);
