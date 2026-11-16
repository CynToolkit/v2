# @pipelab/providers

## 1.0.0-beta.1

### Minor Changes

- 8c0b8a4: Reuse a project-scoped Construct browser profile across exports, run full Chromium headless by default, and use the project's saved Construct release unless the Release source's optional version field overrides it. Preserve patch releases and stop cancelled or failed profile refreshes before browser launch. Open the export dialog with Construct's F6 shortcut to avoid three menu interactions.
- 8c0b8a4: Add Linux ARM64 and Windows ARM64 targets to the Electron release producer, and stop logging the full package configuration.
- ed5dfc8: feat: preflight checks, host-aware builds, workflow settings and a Plan graph

  - Runs check every destination account before the first step and stop if one is definitively rejected (Itch, Poki, Steam). `--skip-preflight` on the CLI and a workflow setting turn it off; dry runs stay offline.
  - Builds that cannot run on the host (for example macOS on Linux) are shown as unavailable and left out of runs.
  - New Workflow settings page: stop on first failure, retention policy with a live preview and Apply now, desktop notifications.
  - Retention is applied at the end of each run and in the background at app start.
  - Duplicate a build from the Builds page.
  - New Plan tab draws the execution plan as a zoomable, pannable graph.
  - The workflow header and tabs stay mounted while you switch tabs; tabs are kept alive, remember their scroll position, and share one workflow document so an edit on one tab is never overwritten by another.
  - Artifacts moved under Runs, Settings is a gear in the tab bar, and Ship has a menu with "Ship without checking destinations" (`skipPreflight` on `workflow:execute`) and "View plan".

- e4ba5e4: Add Pipelab Cloud as a Release destination with private artifact management, encrypted share links, and secure local CLI sign-in. CI uploads remain deferred.
- b4a1a3d: Check the Construct login before a run starts, and add a Test connection button to Construct accounts.

  Steam App and Depot IDs must be digits (checked before a run), and the preflight checks that the account has the configured itch game, Poki game, and Steam App and Depot.

- eabcc96: Add the optional Electron `patchExecutable` configuration to patch packaged Windows executables with gpupatch v0.2.1 and request a high-performance GPU. Patching is disabled by default and runs before build outputs are published.
- cc8a2af: Add Construct Account Connection support to Release workflows, using the provider's existing session and authentication behavior.
- b4a1a3d: feat: add a Test connection button to Connections. A rejected credential blocks saving; an unreachable service or an untestable connection type does not.
- f8cf082: Consolidate the seven built-in provider workspaces into `@pipelab/providers`, with isolated provider modules and tests. Workspace imports use the new package; saved provider, Release, task, and integration IDs remain unchanged, so Release configurations need no migration.
- b322d2c: Add a unified built-in provider contract and export canonical provider definitions from each built-in provider package. Preserve concrete definition types and existing public workflow task and task factory exports.

### Patch Changes

- 790ed8c: Add profile-scoped beforeBuild shell commands that run on isolated artifact copies before Electron packaging, with managed Node.js and pnpm plus run-scoped `PIPELAB_` environment variables.
- db2afdf: Move Release Folder and ZIP providers into core so Release no longer depends on the Filesystem plugin. Generic filesystem and archive operations run as core workflow tasks. Keep `plugin-filesystem` for legacy Pipeline compatibility, and export reusable safe copy and remove helpers from `workflow-runtime`.
- 6fabeaa: Preserve default Electron settings when a Release Workflow leaves build fields unset, and fail a target when Electron Forge produces no output.
- a38c96e: Add typed provider phases to workflow runs and show phase progress in CLI and desktop run history.
- 2ac814b: Use the platform's temporary directory when inspecting Construct browser profiles.
- 6fabeaa: Add a token-only Poki sign-in command that completes browser authentication without uploading a build.
- 1a38588: Report inaccessible Construct browser profiles with an actionable error before attempting export.
- a0ccd23: Construct is now a project source with its own build engine, like Godot. The web export is a Construct build that Electron, Tauri and Poki consume, and Pipelab adds it automatically with the packager when a destination needs it. Defaults pick the web engine that accepts the source. Construct's own Windows (WebView2), macOS (WKWebView) and Linux (CEF) exports are declared but unavailable for now.
- f65ddfa: Prepare the Construct account session before opening the editor, avoiding the post-startup authentication reload.
- 7613cf6: Preseed Construct's automation-managed profile to dismiss the welcome tour, disable UI animations, UI effects and addon update checks, and hide the Start Page on startup.
- 7df1907: Preflight run-scoped environment and connection override values before workflow history or runtime setup. Resolve an immutable alias-to-field snapshot for provider tasks, redact resolved values, and pass the initiating client's environment through execution IPC. Let Itch upload tasks consume the run-scoped Itch API key and reject a missing key before Butler setup.
- 8c0b8a4: Use Construct's Menu → Project → Export path because F6 can open project Properties instead of the export chooser, prevent duplicate confirmation handlers from racing during export, and include editor state when Web export selection fails.
- 07f9a4d: Remove obsolete plugin marketplace APIs, dynamic registration state and ineffective
  provider enablement controls. Migrate settings to schema 8 while preserving real
  preferences and saved connections. Built-in providers ship together with Pipelab;
  integrations configure credentials and accounts on the Connections screen in shipped builds. Provider, Release and task IDs
  remain unchanged.
- 612df89: Redact connected Itch API keys from Butler log messages and step errors.
- 42471a6: Reject an itch.io channel name containing spaces, `:` or `/` before a run starts.
- 42bf940: Desktop forwards exactly the environment variables a run resolves (embedded references included), using the same plan as the run; the UI no longer keeps its own list. Steam and itch.io ID validation ignores `${{ env.X }}` bindings, which are resolved at run time.
- 68dd2ae: A run's environment bindings and Connections now come from one shared walk of what the workflow uses, in core and in the UI; a build nothing reads no longer contributes values. The Poki game check reports a pass only for the answer shape it recognizes.
- 8c0b8a4: Keep workflow artifact paths intact in returned results while redacting them
  from events, require Construct credentials as a complete pair, keep the managed
  browser profile private on POSIX systems, and bound interactive timing refreshes.
- 8c0b8a4: Resolve task input references from the CLI process environment at run time and redact referenced values from workflow logs and results. Construct release workflows can use Doppler-provided credentials without saving them in workflow configuration.
- 3d392e6: Install Electron template and user-selected dependencies in one pnpm operation per build stage.
- a0ccd23: Simplify workflow creation and configuration: the new workflow wizard now has four steps (Name & description, Source & project path, Destinations, Review) with no Builds step, inline settings or notes, and non-clickable step headers. Providers choose which fields appear in the wizard with `showInWizard`. Configuration shows each provider's own icon, a compact destination list with expandable deployments and an inline Add deployment button, quieter status indicators with tooltips, an inline `$` button for environment variables, an auto-named workflow alias, and selects a Connection right after it is added from a field.
- 6fabeaa: Reuse SteamCMD's saved login and provide a manual login command when the cache needs refreshing.
- 41752c1: Make local release builds and history more reliable: inspect Construct profiles from metadata without dropping valid custom profiles, wait for exports to finish preparing before downloading, and treat unmeasured artifact sizes as unknown instead of 0 B. Include useful status and screenshot details when an export stalls.
- 6fabeaa: Expose a SteamCMD login helper so Pipelab CLI can save Steam authentication without uploading a build.
- b4a1a3d: Release builds no longer have enabled/disabled targets or a build on/off switch: every target an engine offers is listed with its own settings, and a target is used when a deployment slot or another build reads it. Deployment slots and Bundle inputs can pick any target of an existing build. Build engines can no longer be changed after creation. Empty deployment slots are filled only when a workflow is created and are never filled again at plan or run time.
- 2ac814b: Preserve relative symlinks when staging Electron builds so macOS framework links do not point back into a removed temporary folder.
- 6bbad43: Remove provider imports of core-node by placing reusable package, download and
  process helpers in the existing helper package. Supply managed paths, executable
  installation and bundled asset resolution through a structural host context.
  Provider, Release and Workflow IDs remain unchanged.

  This is an intentional breaking cleanup of the legacy/internal plugin-core helper
  API: `PipelabContext` is now a provider-facing structural `ProviderHostContext`
  type alias, not the concrete core-node class. `resolveBundledAsset(name, context)`
  requires an explicit host context, and `detectRuntime` and its `OutputRuntimes`
  type are no longer exported from plugin-core; web runtime detection belongs to
  providers. No hidden core-node
  loading or new compatibility layer is introduced.

- 8797017: Improve Construct export recovery for sign-in failures and transient editor navigation resets.
- 6dbac15: The new-release wizard collects a name and description first, then the source and required project path. Construct and Godot use their provider icons.
- 6dbac15: Bundle branded Construct and Godot logos in provider metadata for offline rendering.
- Updated dependencies [790ed8c]
- Updated dependencies [a769376]
- Updated dependencies [16e41ea]
- Updated dependencies [db2afdf]
- Updated dependencies [dbbad55]
- Updated dependencies [5817f0c]
- Updated dependencies [a0ccd23]
- Updated dependencies [ed5dfc8]
- Updated dependencies [21ebef4]
- Updated dependencies [a38c96e]
- Updated dependencies [2ef8f75]
- Updated dependencies [6d54e76]
- Updated dependencies [c4b77fa]
- Updated dependencies [e4ba5e4]
- Updated dependencies [a0ccd23]
- Updated dependencies [7df1907]
- Updated dependencies [eabcc96]
- Updated dependencies [abd5d55]
- Updated dependencies [07f9a4d]
- Updated dependencies [5817f0c]
- Updated dependencies [42bf940]
- Updated dependencies [68dd2ae]
- Updated dependencies [8c0b8a4]
- Updated dependencies [8c0b8a4]
- Updated dependencies [8c0b8a4]
- Updated dependencies [b4a1a3d]
- Updated dependencies [a0ccd23]
- Updated dependencies [eabcc96]
- Updated dependencies [91b93b9]
- Updated dependencies [2ac814b]
- Updated dependencies [c886643]
- Updated dependencies [41752c1]
- Updated dependencies [c67d995]
- Updated dependencies [c67d995]
- Updated dependencies [b4a1a3d]
- Updated dependencies [ed12e98]
- Updated dependencies [37a5319]
- Updated dependencies [6bbad43]
- Updated dependencies [dbbad55]
- Updated dependencies [b322d2c]
  - @pipelab/shared@1.0.0-beta.34
  - @pipelab/workflow-runtime@1.0.0-beta.2
  - @pipelab/plugin-core@1.0.0-beta.40
  - @pipelab/constants@1.0.0-beta.35
