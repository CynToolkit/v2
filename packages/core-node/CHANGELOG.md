# @pipelab/core-node

## 1.0.0-beta.41

### Patch Changes

- a08ba12: An invalid build history file no longer blocks startup: it is moved aside as `*.history.json.invalid-<timestamp>` and an error naming the file is logged, so that project starts with an empty history. When the background server exits during Desktop startup, the startup error now shows its last output instead of a generic ERR_FAILED.

## 1.0.0-beta.40

### Patch Changes

- 5f3e21a: Load Construct's cached Playwright runtime on demand instead of requiring it at application startup. Download automation tools only when inspecting a browser profile or exporting a Construct project.
- Updated dependencies [5f3e21a]
  - @pipelab/providers@1.0.0-beta.2

## 1.0.0-beta.39

Initial prerelease of the new Pipelab v2 product.
