# @pipelab/ui

## 2.0.0-beta.47

### Patch Changes

- [#103](https://github.com/CynToolkit/v2/pull/103) [`7ecb013`](https://github.com/CynToolkit/v2/commit/7ecb01311d9c05dc3a9d82dbcaedf7af6862a196) Thanks [@Armaldio](https://github.com/Armaldio)! - Pipelab can now check for and install updates even when its background server fails to start or keeps crashing. The error dialog offers "Check for updates", so a newer version that fixes the problem can be installed without the app working first. The dashboard no longer shows raw technical errors when projects cannot be loaded; the details stay in the terminal log.

  An unreadable project index or connections file (old format or corrupt file) is now backed up next to the original as `<file>.invalid-<timestamp>` and replaced by a default, so Pipelab keeps working as if nothing was saved.

## 2.0.0-beta.46

No changes in this release.

## 2.0.0-beta.45

No changes in this release.

## 2.0.0-beta.44

No changes in this release.

## 2.0.0-beta.43

### Minor Changes

- [#56](https://github.com/CynToolkit/v2/pull/56) [`081f15f`](https://github.com/CynToolkit/v2/commit/081f15f887ae0d8bef1238a5e866eae96e684c73) Thanks [@Armaldio](https://github.com/Armaldio)! - Remove backward-compatibility code: the Stable/Beta data import, old settings and project index versions, Release configuration 3.0.0, the legacy build-history shape and `pipelines` directory, deprecated provider aliases, and the `SUPABASE_ANON_KEY` fallback. Builds now read `SUPABASE_PUBLISHABLE_KEY` only.

- [#54](https://github.com/CynToolkit/v2/pull/54) [`3e50d26`](https://github.com/CynToolkit/v2/commit/3e50d26b6bfafc40e9d4eafd2d0779d55415e646) Thanks [@Armaldio](https://github.com/Armaldio)! - Add notification targets. A workflow can announce a finished run to Discord, Slack or any HTTPS webhook, with a message template, from the app and from the CLI alike. Webhook URLs are saved as connections, delivery is retried and never fails the run, and the existing success and failure switches now apply to every target. Each target chooses its events: a run succeeds, a run fails, or a named destination is deployed or fails. Targets without a choice keep announcing every finished run. A cancelled run never notifies.

### Patch Changes

- [#94](https://github.com/CynToolkit/v2/pull/94) [`69022ea`](https://github.com/CynToolkit/v2/commit/69022ea2e8004c6f26397344d4cdb0789020954a) Thanks [@Armaldio](https://github.com/Armaldio)! - The editor now builds its provider catalog from a browser-safe `@pipelab/providers/metadata` entry instead of a generated file, so building the editor no longer modifies tracked files. Release definitions are split into catalog descriptors and host-only implementations.

- [#55](https://github.com/CynToolkit/v2/pull/55) [`dd2460c`](https://github.com/CynToolkit/v2/commit/dd2460c324fbb4be61db41d6a7a3048560cb3488) Thanks [@Armaldio](https://github.com/Armaldio)! - Align Editor controls, focus indicators, surfaces, and run status colors across light and dark themes. Improve keyboard navigation in Settings and Connections, and keep run history and logs readable in narrow windows.

- [#89](https://github.com/CynToolkit/v2/pull/89) [`345f890`](https://github.com/CynToolkit/v2/commit/345f890d11e598dfda59e2b7b74b9391597de9e6) Thanks [@Armaldio](https://github.com/Armaldio)! - The Cache and Temp folder buttons in Settings now open the folders in the file manager through a dedicated Desktop action. `pipelab workflow run` now exits nonzero by default when a deployment fails (`--fail-on-error` is still accepted; use `--no-fail-on-error` to opt out), and `pipelab setup` reports authentication and integration choices that are not implemented instead of claiming success, exiting with status 1.

- [#67](https://github.com/CynToolkit/v2/pull/67) [`26421ac`](https://github.com/CynToolkit/v2/commit/26421ac8b0cfb924153f564bc71cf6cc4aa51377) Thanks [@Armaldio](https://github.com/Armaldio)! - The Desktop server now requires a per-launch token on its loopback WebSocket, so other local processes and users can no longer connect and run workflows. A configured token is enforced on loopback binds for `serve` too. The unused `/media-file/` route, which could read any local file path, and the `transformUrl` helper were removed; provider icons are already inline data URIs.

- [#78](https://github.com/CynToolkit/v2/pull/78) [`f47b741`](https://github.com/CynToolkit/v2/commit/f47b74193c2c4a3de634360e2cb4c68f4e7246aa) Thanks [@Armaldio](https://github.com/Armaldio)! - Encrypt Desktop Cloud sessions with a key in the operating system credential store. When the store is unavailable, ask before saving the session without encryption. Keep session tokens out of sign-in responses and WebSocket logs. Sign-out in the editor ends the current session and reports failures.

- [#91](https://github.com/CynToolkit/v2/pull/91) [`dce3d16`](https://github.com/CynToolkit/v2/commit/dce3d1678d79db193a053dc3335e12b81dbfedf4) Thanks [@Armaldio](https://github.com/Armaldio)! - Encrypt saved integration credentials at rest with a key in the operating system credential store, shared by Desktop and the CLI, and migrate existing plaintext connections. The bundled Editor is now served with an enforced Content-Security-Policy.

- [#69](https://github.com/CynToolkit/v2/pull/69) [`6b68811`](https://github.com/CynToolkit/v2/commit/6b688114bd0e7a90fcb07ccc7e367bad26faa1ea) Thanks [@Armaldio](https://github.com/Armaldio)! - Remove `any` and unchecked casts across the app. Electron and Tauri workflow inputs are now validated and fall back to their defaults when unset or of the wrong type, provider JSON responses are checked before use, and the IPC and Desktop bridge contracts are typed end to end.

- [#91](https://github.com/CynToolkit/v2/pull/91) [`dce3d16`](https://github.com/CynToolkit/v2/commit/dce3d1678d79db193a053dc3335e12b81dbfedf4) Thanks [@Armaldio](https://github.com/Armaldio)! - Remove the unused QuickJS runtime and its helpers from the shared package, and tighten the Editor Content-Security-Policy so it no longer allows WebAssembly compilation.

- [#71](https://github.com/CynToolkit/v2/pull/71) [`e38d460`](https://github.com/CynToolkit/v2/commit/e38d460484e04541bd03df97cd5c8c509513bc3f) Thanks [@Armaldio](https://github.com/Armaldio)! - Remove more unchecked type assertions. The editor now validates what Electron returns for native dialogs, migrators require a `defaultValue`, and `runWorkflow` requires `services` whenever its tasks need them.

- [#77](https://github.com/CynToolkit/v2/pull/77) [`928655c`](https://github.com/CynToolkit/v2/commit/928655c918098c47810bfc7a250ef1f626eef080) Thanks [@Armaldio](https://github.com/Armaldio)! - Add a Stable and Beta update channel picker in Desktop settings. Automatic updates follow the installed channel, and switching channels requires a newer release.
- Updated dependencies [[`69022ea`](https://github.com/CynToolkit/v2/commit/69022ea2e8004c6f26397344d4cdb0789020954a), [`b2cd97d`](https://github.com/CynToolkit/v2/commit/b2cd97d5cd7f06208cd2b889f5d36fa51b3ed25e), [`345f890`](https://github.com/CynToolkit/v2/commit/345f890d11e598dfda59e2b7b74b9391597de9e6), [`26421ac`](https://github.com/CynToolkit/v2/commit/26421ac8b0cfb924153f564bc71cf6cc4aa51377), [`a0c10dd`](https://github.com/CynToolkit/v2/commit/a0c10ddcbb5440880e0fe92ecf1f36b3cf1aa194), [`4fdf296`](https://github.com/CynToolkit/v2/commit/4fdf2962127f868b1b89e0e9065c79c2c053c826), [`1b7134e`](https://github.com/CynToolkit/v2/commit/1b7134ecc2770678611d0cc128da38825ab068f9), [`f47b741`](https://github.com/CynToolkit/v2/commit/f47b74193c2c4a3de634360e2cb4c68f4e7246aa), [`6b68811`](https://github.com/CynToolkit/v2/commit/6b688114bd0e7a90fcb07ccc7e367bad26faa1ea), [`081f15f`](https://github.com/CynToolkit/v2/commit/081f15f887ae0d8bef1238a5e866eae96e684c73), [`dce3d16`](https://github.com/CynToolkit/v2/commit/dce3d1678d79db193a053dc3335e12b81dbfedf4), [`e38d460`](https://github.com/CynToolkit/v2/commit/e38d460484e04541bd03df97cd5c8c509513bc3f), [`3b1c287`](https://github.com/CynToolkit/v2/commit/3b1c287146bb532714de92a5759bbf5c5ad2a9a9), [`3e50d26`](https://github.com/CynToolkit/v2/commit/3e50d26b6bfafc40e9d4eafd2d0779d55415e646)]:
  - @pipelab/providers@1.0.0-beta.3
  - @pipelab/shared@1.0.0-beta.35

## 2.0.0-beta.42

## 2.0.0-beta.41

## 2.0.0-beta.40

## 2.0.0-beta.39

Initial prerelease of the new Pipelab v2 product.
