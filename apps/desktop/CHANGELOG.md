# @pipelab/app

## 2.0.0-beta.43

### Minor Changes

- [#21](https://github.com/CynToolkit/v2/pull/21) [`4fdf296`](https://github.com/CynToolkit/v2/commit/4fdf2962127f868b1b89e0e9065c79c2c053c826) Thanks [@Armaldio](https://github.com/Armaldio)! - Replace Squirrel and Electron Forge packaging with electron-builder and electron-updater. Updates now show real download progress, work on Windows (NSIS), macOS and Linux AppImage, and no longer delay startup. Installs from before this release cannot self-update to it and need a manual install.

- [#54](https://github.com/CynToolkit/v2/pull/54) [`3e50d26`](https://github.com/CynToolkit/v2/commit/3e50d26b6bfafc40e9d4eafd2d0779d55415e646) Thanks [@Armaldio](https://github.com/Armaldio)! - Add notification targets. A workflow can announce a finished run to Discord, Slack or any HTTPS webhook, with a message template, from the app and from the CLI alike. Webhook URLs are saved as connections, delivery is retried and never fails the run, and the existing success and failure switches now apply to every target. Each target chooses its events: a run succeeds, a run fails, or a named destination is deployed or fails. Targets without a choice keep announcing every finished run. A cancelled run never notifies.

### Patch Changes

- An invalid build history file no longer blocks startup: it is moved aside as `*.history.json.invalid-<timestamp>` and an error naming the file is logged, so that project starts with an empty history. When the background server exits during Desktop startup, the startup error now shows its last output instead of a generic ERR_FAILED.

- [#89](https://github.com/CynToolkit/v2/pull/89) [`345f890`](https://github.com/CynToolkit/v2/commit/345f890d11e598dfda59e2b7b74b9391597de9e6) Thanks [@Armaldio](https://github.com/Armaldio)! - The Cache and Temp folder buttons in Settings now open the folders in the file manager through a dedicated Desktop action. `pipelab workflow run` now exits nonzero by default when a deployment fails (`--fail-on-error` is still accepted; use `--no-fail-on-error` to opt out), and `pipelab setup` reports authentication and integration choices that are not implemented instead of claiming success, exiting with status 1.

- Load Construct's cached Playwright runtime on demand instead of requiring it at application startup. Download automation tools only when inspecting a browser profile or exporting a Construct project.

- [#67](https://github.com/CynToolkit/v2/pull/67) [`26421ac`](https://github.com/CynToolkit/v2/commit/26421ac8b0cfb924153f564bc71cf6cc4aa51377) Thanks [@Armaldio](https://github.com/Armaldio)! - The Desktop server now requires a per-launch token on its loopback WebSocket, so other local processes and users can no longer connect and run workflows. A configured token is enforced on loopback binds for `serve` too. The unused `/media-file/` route, which could read any local file path, and the `transformUrl` helper were removed; provider icons are already inline data URIs.

- [#78](https://github.com/CynToolkit/v2/pull/78) [`f47b741`](https://github.com/CynToolkit/v2/commit/f47b74193c2c4a3de634360e2cb4c68f4e7246aa) Thanks [@Armaldio](https://github.com/Armaldio)! - Encrypt Desktop Cloud sessions with a key in the operating system credential store. When the store is unavailable, ask before saving the session without encryption. Keep session tokens out of sign-in responses and WebSocket logs. Sign-out in the editor ends the current session and reports failures.

- [#91](https://github.com/CynToolkit/v2/pull/91) [`dce3d16`](https://github.com/CynToolkit/v2/commit/dce3d1678d79db193a053dc3335e12b81dbfedf4) Thanks [@Armaldio](https://github.com/Armaldio)! - Encrypt saved integration credentials at rest with a key in the operating system credential store, shared by Desktop and the CLI, and migrate existing plaintext connections. The bundled Editor is now served with an enforced Content-Security-Policy.

- [#80](https://github.com/CynToolkit/v2/pull/80) [`263196d`](https://github.com/CynToolkit/v2/commit/263196d47b0e991fe795e689b9e2c245b1028ec8) Thanks [@Armaldio](https://github.com/Armaldio)! - CLI usage telemetry now reports only the command name, never its arguments. Desktop restricts privileged IPC calls and renderer navigation to its own local origin, opens only http and https links in the system browser, and removes the unused `media://` file protocol.

- [#65](https://github.com/CynToolkit/v2/pull/65) [`d08a0a1`](https://github.com/CynToolkit/v2/commit/d08a0a18176a474dc75c7642f8040e73b69bee76) Thanks [@Armaldio](https://github.com/Armaldio)! - Desktop now bundles the CLI server (`@pipelab/cli/serve`) and runs it as a supervised child process instead of spawning the separate CLI executable. If the server crashes, Desktop kills everything it started, restarts it, and reloads the window instead of closing. Quitting cancels in-flight workflow runs. An installed Desktop app can run any CLI command, including `serve`, without a separate install with `Pipelab cli <command and options>`.

- [#77](https://github.com/CynToolkit/v2/pull/77) [`928655c`](https://github.com/CynToolkit/v2/commit/928655c918098c47810bfc7a250ef1f626eef080) Thanks [@Armaldio](https://github.com/Armaldio)! - Add a Stable and Beta update channel picker in Desktop settings. Automatic updates follow the installed channel, and switching channels requires a newer release.

- Release the desktop app and standalone CLI together under one Pipelab version.

## 2.0.0-beta.42

### Patch Changes

- a08ba12: An invalid build history file no longer blocks startup: it is moved aside as `*.history.json.invalid-<timestamp>` and an error naming the file is logged, so that project starts with an empty history. When the background server exits during Desktop startup, the startup error now shows its last output instead of a generic ERR_FAILED.

## 2.0.0-beta.41

### Patch Changes

- 5f3e21a: Load Construct's cached Playwright runtime on demand instead of requiring it at application startup. Download automation tools only when inspecting a browser profile or exporting a Construct project.

## 2.0.0-beta.40

### Patch Changes

- f08134e: Release the desktop app and standalone CLI together under one Pipelab version.

## 2.0.0-beta.34

Initial prerelease of the new Pipelab v2 product.
