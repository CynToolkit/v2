import assert from "node:assert/strict";
import { describe, it } from "vitest";
import type { UpdateState } from "@pipelab/shared";
import type { GitHubRelease } from "@pipelab/core-node/desktop";
import { createUpdater, resolveAvailableUpdate, type NativeUpdater } from "./updater";
import { partialDouble } from "@pipelab/shared/test-doubles";

const release: GitHubRelease = {
  prerelease: false,
  published_at: "2026-01-01T00:00:00Z",
  tag_name: "@pipelab/app@2.1.0",
  html_url: "https://example.com/release",
  assets: [
    { name: "pipelab.zip", browser_download_url: "https://example.com/pipelab.zip" },
    { name: "pipelab.dmg", browser_download_url: "https://example.com/pipelab.dmg" },
  ],
};

function fakeNative() {
  const handlers: Record<string, (...args: unknown[]) => void> = {};
  const calls: string[] = [];
  const native = partialDouble<NativeUpdater>({
    setFeedURL: ({ url }: { url: string }) => calls.push(`feed:${url}`),
    checkForUpdates: () => calls.push("check"),
    on: (event: string, cb: (...args: unknown[]) => void): void => void (handlers[event] = cb),
  });
  return { native, handlers, calls };
}

function setup(overrides: { release?: GitHubRelease | null; native?: NativeUpdater } = {}) {
  const sent: UpdateState[] = [];
  const downloaded: string[] = [];
  const updater = createUpdater({
    currentVersion: "2.0.0",
    platform: "darwin",
    native: overrides.native,
    fetchRelease: async () => (overrides.release === undefined ? release : overrides.release),
    feedUrl: (r) => `feed/${r.tag_name}`,
    send: (state) => sent.push(state),
    onDownloaded: (update) => downloaded.push(update.version),
  });
  return { updater, sent, downloaded };
}

describe("resolveAvailableUpdate", () => {
  it("prefers the platform installer and falls back to the release page", () => {
    assert.equal(
      resolveAvailableUpdate(release, "2.0.0", "darwin")?.downloadUrl,
      "https://example.com/pipelab.dmg",
    );
    assert.equal(
      resolveAvailableUpdate(release, "2.0.0", "win32")?.downloadUrl,
      "https://example.com/release",
    );
  });

  it("ignores releases that are not newer", () => {
    assert.equal(resolveAvailableUpdate(release, "2.1.0", "darwin"), null);
    assert.equal(resolveAvailableUpdate(release, "3.0.0", "darwin"), null);
    assert.equal(resolveAvailableUpdate(null, "2.0.0", "darwin"), null);
  });

  it("compares versions across channels using SemVer precedence", () => {
    assert.equal(resolveAvailableUpdate(release, "2.1.0-beta.10", "darwin")?.version, "2.1.0");
    const beta = { ...release, tag_name: "@pipelab/app@2.1.0-beta.10" };
    assert.equal(resolveAvailableUpdate(beta, "2.1.0", "darwin"), null);
    assert.equal(resolveAvailableUpdate(beta, "2.0.0", "darwin")?.version, "2.1.0-beta.10");
  });
});

const statuses = (sent: UpdateState[]) => sent.map((state) => state.status);

describe("createUpdater", () => {
  it("reports no update when the release is not newer", async () => {
    const { updater, sent } = setup({ release: null });
    await updater.check();
    assert.deepEqual(statuses(sent), ["update-not-available"]);
  });

  it("offers a manual download without a native updater", async () => {
    const { updater, sent } = setup();
    await updater.check();
    assert.deepEqual(sent, [
      {
        status: "update-available",
        version: "2.1.0",
        downloadUrl: "https://example.com/pipelab.dmg",
      },
    ]);
  });

  it("downloads natively, reports progress and prompts once downloaded", async () => {
    const { native, handlers, calls } = fakeNative();
    const { updater, sent, downloaded } = setup({ native });
    await updater.check();
    assert.deepEqual(calls, ["feed:feed/@pipelab/app@2.1.0", "check"]);

    handlers["update-available"]();
    handlers["download-progress"]({ percent: 41.6 });
    handlers["update-downloaded"]();

    assert.deepEqual(sent, [
      { status: "update-downloading", version: "2.1.0", progress: 0 },
      { status: "update-downloading", version: "2.1.0", progress: 42 },
      { status: "update-downloaded", version: "2.1.0" },
    ]);
    assert.deepEqual(downloaded, ["2.1.0"]);
    await updater.check();
    assert.equal(calls.length, 2, "no further checks once an update is downloaded");
  });

  it("falls back to a manual download when the native updater errors", async () => {
    const { native, handlers } = fakeNative();
    const { updater, sent } = setup({ native });
    await updater.check();
    handlers.error(new Error("download failed"));
    assert.deepEqual(statuses(sent), ["update-available"]);
  });
});
