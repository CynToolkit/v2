import type { GitHubRelease } from "@pipelab/core-node/desktop";
import type { AvailableUpdate, UpdateState } from "@pipelab/shared";
import semver from "semver";
import type { SetFeedURLOptions, OnProgress } from "./updater.types";

const MANUAL_ASSET_SUFFIXES: Partial<Record<NodeJS.Platform, string[]>> = {
  linux: [".AppImage", ".deb", ".zip"],
  darwin: [".dmg", ".zip"],
  win32: [".exe"],
};

/** Returns the update described by `release` if it is newer than `currentVersion`. */
export function resolveAvailableUpdate(
  release: GitHubRelease | null,
  currentVersion: string,
  platform: NodeJS.Platform,
): AvailableUpdate | null {
  const version = release?.tag_name.split("@").pop();
  if (!release || !version || !semver.valid(version) || !semver.gt(version, currentVersion)) {
    return null;
  }
  const asset = (MANUAL_ASSET_SUFFIXES[platform] ?? [])
    .map((suffix) => release.assets.find((candidate) => candidate.name.endsWith(suffix)))
    .find(Boolean);
  return { version, downloadUrl: asset?.browser_download_url ?? release.html_url };
}

/** The subset of electron-updater's `autoUpdater` this module relies on. */
export interface NativeUpdater {
  setFeedURL(options: SetFeedURLOptions): void;
  checkForUpdates(): Promise<unknown> | void;
  on(
    event: "checking-for-update" | "update-available" | "update-not-available",
    cb: () => void,
  ): void;
  on(event: "download-progress", cb: (progress: OnProgress) => void): void;
  on(event: "update-downloaded", cb: () => void): void;
  on(event: "error", cb: (error: Error) => void): void;
}

export interface UpdaterOptions {
  currentVersion: string;
  platform: NodeJS.Platform;
  /** `undefined` when the install cannot update itself (e.g. Linux without AppImage). */
  native?: NativeUpdater;
  /** Feed channel; mac builds publish one feed per architecture. */
  channel?: string;
  /** Resolves the newest eligible release, or null when none exists. */
  fetchRelease: () => Promise<GitHubRelease | null>;
  /** Directory URL that holds the release's `latest*.yml` feed. */
  feedUrl: (release: GitHubRelease) => string | null;
  send: (state: UpdateState) => void;
  /** Called once an update is downloaded; should offer a restart. */
  onDownloaded: (update: AvailableUpdate) => void;
  log?: (message: string, ...args: unknown[]) => void;
}

/**
 * Update flow: resolve the newest eligible release, stop if it is not newer,
 * then either let electron-updater download it with progress, or hand the
 * renderer a download link when the install cannot update itself or the
 * download fails.
 */
export function createUpdater(options: UpdaterOptions) {
  const { native, send, log = () => {} } = options;
  let current: AvailableUpdate | null = null;
  let busy = false;
  let downloaded = false;

  const offerManualDownload = (update: AvailableUpdate) =>
    send({ status: "update-available", ...update });
  const version = () => current?.version;

  native?.on("checking-for-update", () => send({ status: "checking-for-update" }));
  native?.on("update-available", () =>
    send({ status: "update-downloading", version: version(), progress: 0 }),
  );
  native?.on("update-not-available", () => send({ status: "update-not-available" }));
  native?.on("download-progress", ({ percent }) =>
    send({ status: "update-downloading", version: version(), progress: Math.round(percent) }),
  );
  native?.on("update-downloaded", () => {
    downloaded = true;
    send({ status: "update-downloaded", version: version() });
    if (current) options.onDownloaded(current);
  });
  native?.on("error", (error) => {
    log("update failed", error);
    busy = false;
    if (current) offerManualDownload(current);
    else send({ status: "error" });
  });

  async function check(): Promise<void> {
    if (busy || downloaded) return;
    busy = true;
    current = null;
    try {
      const release = await options.fetchRelease();
      current = resolveAvailableUpdate(release, options.currentVersion, options.platform);
      const feed = release && options.feedUrl(release);
      if (!current || !feed) {
        send({ status: "update-not-available" });
      } else if (native) {
        native.setFeedURL({ provider: "generic", url: feed, channel: options.channel });
        await native.checkForUpdates();
      } else {
        offerManualDownload(current);
      }
    } catch (error) {
      log("update check failed", error);
      // The `error` event already reports native failures.
      if (!native || !current) send({ status: "error" });
    } finally {
      busy = false;
    }
  }

  return { check };
}
