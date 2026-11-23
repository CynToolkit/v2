# @pipelab/providers

## 1.0.0-beta.3

### Minor Changes

- [#56](https://github.com/CynToolkit/v2/pull/56) [`081f15f`](https://github.com/CynToolkit/v2/commit/081f15f887ae0d8bef1238a5e866eae96e684c73) Thanks [@Armaldio](https://github.com/Armaldio)! - Remove backward-compatibility code: the Stable/Beta data import, old settings and project index versions, Release configuration 3.0.0, the legacy build-history shape and `pipelines` directory, deprecated provider aliases, and the `SUPABASE_ANON_KEY` fallback. Builds now read `SUPABASE_PUBLISHABLE_KEY` only.

- [#54](https://github.com/CynToolkit/v2/pull/54) [`3e50d26`](https://github.com/CynToolkit/v2/commit/3e50d26b6bfafc40e9d4eafd2d0779d55415e646) Thanks [@Armaldio](https://github.com/Armaldio)! - Add notification targets. A workflow can announce a finished run to Discord, Slack or any HTTPS webhook, with a message template, from the app and from the CLI alike. Webhook URLs are saved as connections, delivery is retried and never fails the run, and the existing success and failure switches now apply to every target. Each target chooses its events: a run succeeds, a run fails, or a named destination is deployed or fails. Targets without a choice keep announcing every finished run. A cancelled run never notifies.

### Patch Changes

- [#94](https://github.com/CynToolkit/v2/pull/94) [`69022ea`](https://github.com/CynToolkit/v2/commit/69022ea2e8004c6f26397344d4cdb0789020954a) Thanks [@Armaldio](https://github.com/Armaldio)! - The editor now builds its provider catalog from a browser-safe `@pipelab/providers/metadata` entry instead of a generated file, so building the editor no longer modifies tracked files. Release definitions are split into catalog descriptors and host-only implementations.

- [#90](https://github.com/CynToolkit/v2/pull/90) [`b2cd97d`](https://github.com/CynToolkit/v2/commit/b2cd97d5cd7f06208cd2b889f5d36fa51b3ed25e) Thanks [@Armaldio](https://github.com/Armaldio)! - Construct exports now launch Chromium with a software WebGL fallback (SwiftShader), so exports no longer fail with "Failed to initialize WebGL" on machines without a usable GPU, such as macOS CI runners and VMs.

- Load Construct's cached Playwright runtime on demand instead of requiring it at application startup. Download automation tools only when inspecting a browser profile or exporting a Construct project.

- [#82](https://github.com/CynToolkit/v2/pull/82) [`1b7134e`](https://github.com/CynToolkit/v2/commit/1b7134ecc2770678611d0cc128da38825ab068f9) Thanks [@Armaldio](https://github.com/Armaldio)! - Update `adm-zip` and force patched versions of transitive dependencies with high or critical security advisories.

- [#69](https://github.com/CynToolkit/v2/pull/69) [`6b68811`](https://github.com/CynToolkit/v2/commit/6b688114bd0e7a90fcb07ccc7e367bad26faa1ea) Thanks [@Armaldio](https://github.com/Armaldio)! - Remove `any` and unchecked casts across the app. Electron and Tauri workflow inputs are now validated and fall back to their defaults when unset or of the wrong type, provider JSON responses are checked before use, and the IPC and Desktop bridge contracts are typed end to end.

- [#93](https://github.com/CynToolkit/v2/pull/93) [`3b1c287`](https://github.com/CynToolkit/v2/commit/3b1c287146bb532714de92a5759bbf5c5ad2a9a9) Thanks [@Armaldio](https://github.com/Armaldio)! - Electron game builds with the default configuration now install from a bundled lockfile, so they are reproducible and work from the local pnpm cache. Builds that override the Electron version or add custom packages still resolve dependencies fresh.
- Updated dependencies [[`69022ea`](https://github.com/CynToolkit/v2/commit/69022ea2e8004c6f26397344d4cdb0789020954a), [`345f890`](https://github.com/CynToolkit/v2/commit/345f890d11e598dfda59e2b7b74b9391597de9e6), [`26421ac`](https://github.com/CynToolkit/v2/commit/26421ac8b0cfb924153f564bc71cf6cc4aa51377), [`a0c10dd`](https://github.com/CynToolkit/v2/commit/a0c10ddcbb5440880e0fe92ecf1f36b3cf1aa194), [`4fdf296`](https://github.com/CynToolkit/v2/commit/4fdf2962127f868b1b89e0e9065c79c2c053c826), [`f47b741`](https://github.com/CynToolkit/v2/commit/f47b74193c2c4a3de634360e2cb4c68f4e7246aa), [`6b68811`](https://github.com/CynToolkit/v2/commit/6b688114bd0e7a90fcb07ccc7e367bad26faa1ea), [`081f15f`](https://github.com/CynToolkit/v2/commit/081f15f887ae0d8bef1238a5e866eae96e684c73), [`dce3d16`](https://github.com/CynToolkit/v2/commit/dce3d1678d79db193a053dc3335e12b81dbfedf4), [`e38d460`](https://github.com/CynToolkit/v2/commit/e38d460484e04541bd03df97cd5c8c509513bc3f), [`3e50d26`](https://github.com/CynToolkit/v2/commit/3e50d26b6bfafc40e9d4eafd2d0779d55415e646)]:
  - @pipelab/shared@1.0.0-beta.35
  - @pipelab/workflow-runtime@1.0.0-beta.3
  - @pipelab/plugin-core@1.0.0-beta.41

## 1.0.0-beta.2

### Patch Changes

- 5f3e21a: Load Construct's cached Playwright runtime on demand instead of requiring it at application startup. Download automation tools only when inspecting a browser profile or exporting a Construct project.

## 1.0.0-beta.1

Initial prerelease of the new Pipelab v2 product.
