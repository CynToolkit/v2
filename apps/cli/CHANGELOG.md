# @pipelab/cli

## 2.0.0-beta.45

### Patch Changes

- Updated dependencies [[`db964d1`](https://github.com/CynToolkit/v2/commit/db964d1d00f7a33b1b893093654111c7ae894a45)]:
  - @pipelab/core-node@1.0.0-beta.43

## 2.0.0-beta.44

No changes in this release.

## 2.0.0-beta.43

### Minor Changes

- [#54](https://github.com/CynToolkit/v2/pull/54) [`3e50d26`](https://github.com/CynToolkit/v2/commit/3e50d26b6bfafc40e9d4eafd2d0779d55415e646) Thanks [@Armaldio](https://github.com/Armaldio)! - Add notification targets. A workflow can announce a finished run to Discord, Slack or any HTTPS webhook, with a message template, from the app and from the CLI alike. Webhook URLs are saved as connections, delivery is retried and never fails the run, and the existing success and failure switches now apply to every target. Each target chooses its events: a run succeeds, a run fails, or a named destination is deployed or fails. Targets without a choice keep announcing every finished run. A cancelled run never notifies.

### Patch Changes

- [#14](https://github.com/CynToolkit/v2/pull/14) [`bf48035`](https://github.com/CynToolkit/v2/commit/bf480357cba3c3e4779a450af0794c914fca8cf2) Thanks [@Armaldio](https://github.com/Armaldio)! - Show the changeset entries, formatted with pull request and author links, as the GitHub release notes.

- [#89](https://github.com/CynToolkit/v2/pull/89) [`345f890`](https://github.com/CynToolkit/v2/commit/345f890d11e598dfda59e2b7b74b9391597de9e6) Thanks [@Armaldio](https://github.com/Armaldio)! - The Cache and Temp folder buttons in Settings now open the folders in the file manager through a dedicated Desktop action. `pipelab workflow run` now exits nonzero by default when a deployment fails (`--fail-on-error` is still accepted; use `--no-fail-on-error` to opt out), and `pipelab setup` reports authentication and integration choices that are not implemented instead of claiming success, exiting with status 1.

- Load Construct's cached Playwright runtime on demand instead of requiring it at application startup. Download automation tools only when inspecting a browser profile or exporting a Construct project.

- [#78](https://github.com/CynToolkit/v2/pull/78) [`f47b741`](https://github.com/CynToolkit/v2/commit/f47b74193c2c4a3de634360e2cb4c68f4e7246aa) Thanks [@Armaldio](https://github.com/Armaldio)! - Encrypt Desktop Cloud sessions with a key in the operating system credential store. When the store is unavailable, ask before saving the session without encryption. Keep session tokens out of sign-in responses and WebSocket logs. Sign-out in the editor ends the current session and reports failures.

- [#80](https://github.com/CynToolkit/v2/pull/80) [`263196d`](https://github.com/CynToolkit/v2/commit/263196d47b0e991fe795e689b9e2c245b1028ec8) Thanks [@Armaldio](https://github.com/Armaldio)! - CLI usage telemetry now reports only the command name, never its arguments. Desktop restricts privileged IPC calls and renderer navigation to its own local origin, opens only http and https links in the system browser, and removes the unused `media://` file protocol.

- [#65](https://github.com/CynToolkit/v2/pull/65) [`d08a0a1`](https://github.com/CynToolkit/v2/commit/d08a0a18176a474dc75c7642f8040e73b69bee76) Thanks [@Armaldio](https://github.com/Armaldio)! - Desktop now bundles the CLI server (`@pipelab/cli/serve`) and runs it as a supervised child process instead of spawning the separate CLI executable. If the server crashes, Desktop kills everything it started, restarts it, and reloads the window instead of closing. Quitting cancels in-flight workflow runs. An installed Desktop app can run any CLI command, including `serve`, without a separate install with `Pipelab cli <command and options>`.

- Release the desktop app and standalone CLI together under one Pipelab version.
- Updated dependencies [[`69022ea`](https://github.com/CynToolkit/v2/commit/69022ea2e8004c6f26397344d4cdb0789020954a), [`b2cd97d`](https://github.com/CynToolkit/v2/commit/b2cd97d5cd7f06208cd2b889f5d36fa51b3ed25e), [`345f890`](https://github.com/CynToolkit/v2/commit/345f890d11e598dfda59e2b7b74b9391597de9e6), [`26421ac`](https://github.com/CynToolkit/v2/commit/26421ac8b0cfb924153f564bc71cf6cc4aa51377), [`a0c10dd`](https://github.com/CynToolkit/v2/commit/a0c10ddcbb5440880e0fe92ecf1f36b3cf1aa194), [`4fdf296`](https://github.com/CynToolkit/v2/commit/4fdf2962127f868b1b89e0e9065c79c2c053c826), [`1b7134e`](https://github.com/CynToolkit/v2/commit/1b7134ecc2770678611d0cc128da38825ab068f9), [`f47b741`](https://github.com/CynToolkit/v2/commit/f47b74193c2c4a3de634360e2cb4c68f4e7246aa), [`dce3d16`](https://github.com/CynToolkit/v2/commit/dce3d1678d79db193a053dc3335e12b81dbfedf4), [`6b68811`](https://github.com/CynToolkit/v2/commit/6b688114bd0e7a90fcb07ccc7e367bad26faa1ea), [`081f15f`](https://github.com/CynToolkit/v2/commit/081f15f887ae0d8bef1238a5e866eae96e684c73), [`dce3d16`](https://github.com/CynToolkit/v2/commit/dce3d1678d79db193a053dc3335e12b81dbfedf4), [`e38d460`](https://github.com/CynToolkit/v2/commit/e38d460484e04541bd03df97cd5c8c509513bc3f), [`3b1c287`](https://github.com/CynToolkit/v2/commit/3b1c287146bb532714de92a5759bbf5c5ad2a9a9), [`3e50d26`](https://github.com/CynToolkit/v2/commit/3e50d26b6bfafc40e9d4eafd2d0779d55415e646), [`d08a0a1`](https://github.com/CynToolkit/v2/commit/d08a0a18176a474dc75c7642f8040e73b69bee76)]:
  - @pipelab/providers@1.0.0-beta.3
  - @pipelab/shared@1.0.0-beta.35
  - @pipelab/core-node@1.0.0-beta.42
  - @pipelab/workflow-runtime@1.0.0-beta.3

## 2.0.0-beta.42

### Patch Changes

- Updated dependencies [a08ba12]
  - @pipelab/core-node@1.0.0-beta.41

## 2.0.0-beta.41

### Patch Changes

- 5f3e21a: Load Construct's cached Playwright runtime on demand instead of requiring it at application startup. Download automation tools only when inspecting a browser profile or exporting a Construct project.
- Updated dependencies [5f3e21a]
  - @pipelab/providers@1.0.0-beta.2
  - @pipelab/core-node@1.0.0-beta.40

## 2.0.0-beta.40

### Patch Changes

- f08134e: Release the desktop app and standalone CLI together under one Pipelab version.

## 2.0.0-beta.39

Initial prerelease of the new Pipelab v2 product.
