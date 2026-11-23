import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { afterEach, describe, it } from "vitest";
import { openManagedFolder } from "./open-managed-folder";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("openManagedFolder", () => {
  it("creates and opens the resolved cache or temp folder", async () => {
    const root = await mkdtemp(join(tmpdir(), "pipelab-managed-"));
    tempDirs.push(root);
    const opened: string[] = [];

    await openManagedFolder(
      "cache",
      (kind) => join(root, kind),
      async (path) => {
        opened.push(path);
        return "";
      },
    );

    assert.deepEqual(opened, [join(root, "cache")]);
    assert.ok((await stat(join(root, "cache"))).isDirectory());
  });

  it("rejects anything other than the known folder kinds", async () => {
    const opened: string[] = [];
    for (const value of ["/etc", "file:///etc", "", undefined, { kind: "cache" }]) {
      await assert.rejects(
        openManagedFolder(
          value,
          () => "/unused",
          async (path) => {
            opened.push(path);
            return "";
          },
        ),
        /Only the cache and temp folders/,
      );
    }
    assert.deepEqual(opened, []);
  });

  it("surfaces a failure reported by the shell", async () => {
    const root = await mkdtemp(join(tmpdir(), "pipelab-managed-"));
    tempDirs.push(root);
    await assert.rejects(
      openManagedFolder(
        "temp",
        (kind) => join(root, kind),
        async () => "no handler",
      ),
      /Could not open temp folder: no handler/,
    );
  });
});
