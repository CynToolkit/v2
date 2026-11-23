# @pipelab/shared

## 1.0.0-beta.35

### Minor Changes

- [#56](https://github.com/CynToolkit/v2/pull/56) [`081f15f`](https://github.com/CynToolkit/v2/commit/081f15f887ae0d8bef1238a5e866eae96e684c73) Thanks [@Armaldio](https://github.com/Armaldio)! - Remove backward-compatibility code: the Stable/Beta data import, old settings and project index versions, Release configuration 3.0.0, the legacy build-history shape and `pipelines` directory, deprecated provider aliases, and the `SUPABASE_ANON_KEY` fallback. Builds now read `SUPABASE_PUBLISHABLE_KEY` only.

- [#54](https://github.com/CynToolkit/v2/pull/54) [`3e50d26`](https://github.com/CynToolkit/v2/commit/3e50d26b6bfafc40e9d4eafd2d0779d55415e646) Thanks [@Armaldio](https://github.com/Armaldio)! - Add notification targets. A workflow can announce a finished run to Discord, Slack or any HTTPS webhook, with a message template, from the app and from the CLI alike. Webhook URLs are saved as connections, delivery is retried and never fails the run, and the existing success and failure switches now apply to every target. Each target chooses its events: a run succeeds, a run fails, or a named destination is deployed or fails. Targets without a choice keep announcing every finished run. A cancelled run never notifies.

### Patch Changes

- [#94](https://github.com/CynToolkit/v2/pull/94) [`69022ea`](https://github.com/CynToolkit/v2/commit/69022ea2e8004c6f26397344d4cdb0789020954a) Thanks [@Armaldio](https://github.com/Armaldio)! - The editor now builds its provider catalog from a browser-safe `@pipelab/providers/metadata` entry instead of a generated file, so building the editor no longer modifies tracked files. Release definitions are split into catalog descriptors and host-only implementations.

- [#89](https://github.com/CynToolkit/v2/pull/89) [`345f890`](https://github.com/CynToolkit/v2/commit/345f890d11e598dfda59e2b7b74b9391597de9e6) Thanks [@Armaldio](https://github.com/Armaldio)! - The Cache and Temp folder buttons in Settings now open the folders in the file manager through a dedicated Desktop action. `pipelab workflow run` now exits nonzero by default when a deployment fails (`--fail-on-error` is still accepted; use `--no-fail-on-error` to opt out), and `pipelab setup` reports authentication and integration choices that are not implemented instead of claiming success, exiting with status 1.

- [#67](https://github.com/CynToolkit/v2/pull/67) [`26421ac`](https://github.com/CynToolkit/v2/commit/26421ac8b0cfb924153f564bc71cf6cc4aa51377) Thanks [@Armaldio](https://github.com/Armaldio)! - The Desktop server now requires a per-launch token on its loopback WebSocket, so other local processes and users can no longer connect and run workflows. A configured token is enforced on loopback binds for `serve` too. The unused `/media-file/` route, which could read any local file path, and the `transformUrl` helper were removed; provider icons are already inline data URIs.

- [#74](https://github.com/CynToolkit/v2/pull/74) [`a0c10dd`](https://github.com/CynToolkit/v2/commit/a0c10ddcbb5440880e0fe92ecf1f36b3cf1aa194) Thanks [@Armaldio](https://github.com/Armaldio)! - Migrators now check the migrated state against the schema of the latest version. Settings, connections and project files missing keys that older builds did not write get their defaults, unknown keys are dropped, and a file that still does not match is treated as corrupted (backed up, then reset to defaults). Migrating to an older version is now `migrateTo`.

- [#21](https://github.com/CynToolkit/v2/pull/21) [`4fdf296`](https://github.com/CynToolkit/v2/commit/4fdf2962127f868b1b89e0e9065c79c2c053c826) Thanks [@Armaldio](https://github.com/Armaldio)! - Replace Squirrel and Electron Forge packaging with electron-builder and electron-updater. Updates now show real download progress, work on Windows (NSIS), macOS and Linux AppImage, and no longer delay startup. Installs from before this release cannot self-update to it and need a manual install.

- [#78](https://github.com/CynToolkit/v2/pull/78) [`f47b741`](https://github.com/CynToolkit/v2/commit/f47b74193c2c4a3de634360e2cb4c68f4e7246aa) Thanks [@Armaldio](https://github.com/Armaldio)! - Encrypt Desktop Cloud sessions with a key in the operating system credential store. When the store is unavailable, ask before saving the session without encryption. Keep session tokens out of sign-in responses and WebSocket logs. Sign-out in the editor ends the current session and reports failures.

- [#69](https://github.com/CynToolkit/v2/pull/69) [`6b68811`](https://github.com/CynToolkit/v2/commit/6b688114bd0e7a90fcb07ccc7e367bad26faa1ea) Thanks [@Armaldio](https://github.com/Armaldio)! - Remove `any` and unchecked casts across the app. Electron and Tauri workflow inputs are now validated and fall back to their defaults when unset or of the wrong type, provider JSON responses are checked before use, and the IPC and Desktop bridge contracts are typed end to end.

- [#91](https://github.com/CynToolkit/v2/pull/91) [`dce3d16`](https://github.com/CynToolkit/v2/commit/dce3d1678d79db193a053dc3335e12b81dbfedf4) Thanks [@Armaldio](https://github.com/Armaldio)! - Remove the unused QuickJS runtime and its helpers from the shared package, and tighten the Editor Content-Security-Policy so it no longer allows WebAssembly compilation.

- [#71](https://github.com/CynToolkit/v2/pull/71) [`e38d460`](https://github.com/CynToolkit/v2/commit/e38d460484e04541bd03df97cd5c8c509513bc3f) Thanks [@Armaldio](https://github.com/Armaldio)! - Remove more unchecked type assertions. The editor now validates what Electron returns for native dialogs, migrators require a `defaultValue`, and `runWorkflow` requires `services` whenever its tasks need them.
- Updated dependencies [[`a0c10dd`](https://github.com/CynToolkit/v2/commit/a0c10ddcbb5440880e0fe92ecf1f36b3cf1aa194), [`081f15f`](https://github.com/CynToolkit/v2/commit/081f15f887ae0d8bef1238a5e866eae96e684c73), [`e38d460`](https://github.com/CynToolkit/v2/commit/e38d460484e04541bd03df97cd5c8c509513bc3f)]:
  - @pipelab/migration@1.0.0-beta.33
  - @pipelab/workflow-runtime@1.0.0-beta.3

## 1.0.0-beta.34

Initial prerelease of the new Pipelab v2 product.
