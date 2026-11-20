import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { resolveBundledAsset, resolveBundledUiFolder } from "./bundled-cli";

describe("bundled CLI resources", () => {
  test("resolves the UI beside the CLI entrypoint", () => {
    expect(resolveBundledUiFolder("/resources/cli")).toBe(join("/resources/cli", "ui"));
  });

  test("resolves an asset template from the CLI distribution", async () => {
    const cliDir = await mkdtemp(join(tmpdir(), "pipelab-cli-"));
    const assetDir = join(cliDir, "assets", "asset-electron");
    await mkdir(assetDir, { recursive: true });
    await writeFile(
      join(assetDir, "package.json"),
      JSON.stringify({ name: "@pipelab/asset-electron" }),
    );

    expect(resolveBundledAsset("@pipelab/asset-electron", cliDir)).toBe(assetDir);
  });

  test("rejects asset packages that are not staged in the CLI", async () => {
    const cliDir = await mkdtemp(join(tmpdir(), "pipelab-cli-"));

    expect(() => resolveBundledAsset("@pipelab/asset-tauri", cliDir)).toThrow(
      "Bundled asset @pipelab/asset-tauri was not found",
    );
  });
});
