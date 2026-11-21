# @pipelab/app

## 2.0.0-beta.43

### Minor Changes

- [#21](https://github.com/CynToolkit/v2/pull/21) [`4fdf296`](https://github.com/CynToolkit/v2/commit/4fdf2962127f868b1b89e0e9065c79c2c053c826) Thanks [@Armaldio](https://github.com/Armaldio)! - Replace Squirrel and Electron Forge packaging with electron-builder and electron-updater. Updates now show real download progress, work on Windows (NSIS), macOS and Linux AppImage, and no longer delay startup. Installs from before this release cannot self-update to it and need a manual install.

- [#54](https://github.com/CynToolkit/v2/pull/54) [`3e50d26`](https://github.com/CynToolkit/v2/commit/3e50d26b6bfafc40e9d4eafd2d0779d55415e646) Thanks [@Armaldio](https://github.com/Armaldio)! - Add notification targets. A workflow can announce a finished run to Discord, Slack or any HTTPS webhook, with a message template, from the app and from the CLI alike. Webhook URLs are saved as connections, delivery is retried and never fails the run, and the existing success and failure switches now apply to every target. Each target chooses its events: a run succeeds, a run fails, or a named destination is deployed or fails. Targets without a choice keep announcing every finished run. A cancelled run never notifies.

### Patch Changes

- An invalid build history file no longer blocks startup: it is moved aside as `*.history.json.invalid-<timestamp>` and an error naming the file is logged, so that project starts with an empty history. When the background server exits during Desktop startup, the startup error now shows its last output instead of a generic ERR_FAILED.

- Load Construct's cached Playwright runtime on demand instead of requiring it at application startup. Download automation tools only when inspecting a browser profile or exporting a Construct project.

- [#67](https://github.com/CynToolkit/v2/pull/67) [`26421ac`](https://github.com/CynToolkit/v2/commit/26421ac8b0cfb924153f564bc71cf6cc4aa51377) Thanks [@Armaldio](https://github.com/Armaldio)! - The Desktop server now requires a per-launch token on its loopback WebSocket, so other local processes and users can no longer connect and run workflows. A configured token is enforced on loopback binds for `serve` too. The unused `/media-file/` route, which could read any local file path, and the `transformUrl` helper were removed; provider icons are already inline data URIs.

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
