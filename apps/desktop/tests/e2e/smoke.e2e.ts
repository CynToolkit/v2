import { expect, test } from "@playwright/test";
import { launchPackagedApp } from "./packaged-app";

test("packaged app starts and the renderer connects to the bundled host", async () => {
  const app = await launchPackagedApp();
  try {
    const { page } = app;
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.waitForLoadState("load");

    // The UI is served by the bundled CLI server on loopback, not by a dev server.
    expect(new URL(page.url()).hostname).toBe("127.0.0.1");
    // The Vue app mounted.
    await expect(page.locator("#app")).not.toBeEmpty();
    // The preload bridge is exposed to the renderer.
    expect(await page.evaluate(() => typeof (window as { pipelab?: unknown }).pipelab)).toBe(
      "object",
    );
    expect(pageErrors).toEqual([]);
  } finally {
    await app.close();
  }
});
