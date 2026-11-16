# @pipelab/workflow-runtime

## 1.0.0-beta.2

### Minor Changes

- 5817f0c: Define the native Workflow task context and Pipelab services bundle, with native task test utilities for plugin Workflow tasks.
- a38c96e: Add typed provider phases to workflow runs and show phase progress in CLI and desktop run history.
- 7df1907: Preflight run-scoped environment and connection override values before workflow history or runtime setup. Resolve an immutable alias-to-field snapshot for provider tasks, redact resolved values, and pass the initiating client's environment through execution IPC. Let Itch upload tasks consume the run-scoped Itch API key and reject a missing key before Butler setup.
- 8c0b8a4: Resolve task input references from the CLI process environment at run time and redact referenced values from workflow logs and results. Construct release workflows can use Doppler-provided credentials without saving them in workflow configuration.
- 2ac814b: Expose workflow task IDs through a browser-safe entry point so shared release compilation does not load the Node.js process host in Desktop's renderer. Include a package-root declaration so TypeScript consumers using legacy Node resolution can use the documented subpath.

### Patch Changes

- db2afdf: Move Release Folder and ZIP providers into core so Release no longer depends on the Filesystem plugin. Generic filesystem and archive operations run as core workflow tasks. Keep `plugin-filesystem` for legacy Pipeline compatibility, and export reusable safe copy and remove helpers from `workflow-runtime`.
- 42bf940: Desktop forwards exactly the environment variables a run resolves (embedded references included), using the same plan as the run; the UI no longer keeps its own list. Steam and itch.io ID validation ignores `${{ env.X }}` bindings, which are resolved at run time.
- 8c0b8a4: Keep workflow artifact paths intact in returned results while redacting them
  from events, require Construct credentials as a complete pair, keep the managed
  browser profile private on POSIX systems, and bound interactive timing refreshes.
- c67d995: Keep workflow delivery results valid for strict history persistence and initialize missing connection data safely under concurrent starts.
