# @pipelab/shared

## 1.0.0-beta.34

### Major Changes

- 16e41ea: Remove the legacy Pipeline editor, management commands, execution entry points, and Pipeline migration/import/export surfaces. Release workflows remain available in the UI and CLI.
- c4b77fa: Use `done` as the only startup completion event in the shared contract and reject duplicate Release source, producer, or destination IDs when building the core registry.
- 5817f0c: Remove the ActionRunner/Action execution API and the workflow adapter. Plugin
  registries and plugin tests now use native WorkflowTask implementations.
- eabcc96: Remove the standalone GPU patching plugin and its **Patch binary** action from the bundled engine and default configuration. Existing pipelines using that action must remove it and enable Electron's **Patch executable** option. Saved pipelines are not automatically converted.

### Minor Changes

- 790ed8c: Add profile-scoped beforeBuild shell commands that run on isolated artifact copies before Electron packaging, with managed Node.js and pnpm plus run-scoped `PIPELAB_` environment variables.
- a769376: feat: add Paths — a beginner-friendly shipping companion UI

  Replace the dead simple-editor with a new Path Builder screen:

  - Source card at the top (engine type + folder + last export)
  - Per-destination rows with delivery selector (App/Web/Archive) and Ship button
  - Add/remove destinations via inline sheets, no navigation
  - Credentials inline on first use, keychain-referenced
  - Ship All button for parallel shipping
  - Destination states: ready, shipping (progress), shipped (timestamp), failed (retry/skip), skipped

  New path data model in shared (Source, Destination, Path, RunState types).
  Old plugin-based pipeline remains functional; Paths is a parallel entry point.

- ed5dfc8: feat: preflight checks, host-aware builds, workflow settings and a Plan graph

  - Runs check every destination account before the first step and stop if one is definitively rejected (Itch, Poki, Steam). `--skip-preflight` on the CLI and a workflow setting turn it off; dry runs stay offline.
  - Builds that cannot run on the host (for example macOS on Linux) are shown as unavailable and left out of runs.
  - New Workflow settings page: stop on first failure, retention policy with a live preview and Apply now, desktop notifications.
  - Retention is applied at the end of each run and in the background at app start.
  - Duplicate a build from the Builds page.
  - New Plan tab draws the execution plan as a zoomable, pannable graph.
  - The workflow header and tabs stay mounted while you switch tabs; tabs are kept alive, remember their scroll position, and share one workflow document so an edit on one tab is never overwritten by another.
  - Artifacts moved under Runs, Settings is a gear in the tab bar, and Ship has a menu with "Ship without checking destinations" (`skipPreflight` on `workflow:execute`) and "View plan".

- a38c96e: Add typed provider phases to workflow runs and show phase progress in CLI and desktop run history.
- e4ba5e4: Add Pipelab Cloud as a Release destination with private artifact management, encrypted share links, and secure local CLI sign-in. CI uploads remain deferred.
- 07f9a4d: Remove obsolete plugin marketplace APIs, dynamic registration state and ineffective
  provider enablement controls. Migrate settings to schema 8 while preserving real
  preferences and saved connections. Built-in providers ship together with Pipelab;
  integrations configure credentials and accounts on the Connections screen in shipped builds. Provider, Release and task IDs
  remain unchanged.
- b4a1a3d: feat: add a Test connection button to Connections. A rejected credential blocks saving; an unreachable service or an untestable connection type does not.
- c886643: Expose the Desktop workflow environment reader and provider requirement metadata through the desktop entry point. Give repeated release destinations saved workflow names so they remain easy to tell apart.
- b4a1a3d: Release builds no longer have enabled/disabled targets or a build on/off switch: every target an engine offers is listed with its own settings, and a target is used when a deployment slot or another build reads it. Deployment slots and Bundle inputs can pick any target of an existing build. Build engines can no longer be changed after creation. Empty deployment slots are filled only when a workflow is created and are never filled again at plan or run time.
- ed12e98: Package built-in Release provider specifications with the browser UI and mark host-dependent checks as requiring the agent.
- b322d2c: Add a unified built-in provider contract and export canonical provider definitions from each built-in provider package. Preserve concrete definition types and existing public workflow task and task factory exports.

### Patch Changes

- dbbad55: Add a dashboard Ship action for saved workflows and localize its labels.
- a0ccd23: Add multi-input builds and a Bundle build that puts the outputs of several builds, for example the Windows, Linux and macOS builds, into one ZIP with one folder per input. Defaults now come from one central table (`RELEASE_DEFAULTS`), and the ZIP destination accepts a ZIP archive as well as a folder. Builds expose all their enabled targets but only the targets that a slot, Bundle or other build uses are built, and automatic builds target the current operating system.
- 21ebef4: Polish the UI: highlight the active step in the new workflow wizard, add proper empty states with actions for Workflows and Connections, align Cloud files with the other pages, and replace the placeholder Team page.
- 2ef8f75: Polish the workflow catalog with clearer actions, readable provider fallbacks, and actionable load errors.
- 6d54e76: Use SUPABASE_PUBLISHABLE_KEY as the canonical Supabase client key while retaining the legacy fallback.
- a0ccd23: Construct is now a project source with its own build engine, like Godot. The web export is a Construct build that Electron, Tauri and Poki consume, and Pipelab adds it automatically with the packager when a destination needs it. Defaults pick the web engine that accepts the source. Construct's own Windows (WebView2), macOS (WKWebView) and Linux (CEF) exports are declared but unavailable for now.
- 7df1907: Preflight run-scoped environment and connection override values before workflow history or runtime setup. Resolve an immutable alias-to-field snapshot for provider tasks, redact resolved values, and pass the initiating client's environment through execution IPC. Let Itch upload tasks consume the run-scoped Itch API key and reject a missing key before Butler setup.
- abd5d55: Redesign the project dashboard around the latest release and recent runs, and make run history and multiple projects available on the Free plan. Only cloud features remain plan-gated.
- 68dd2ae: A run's environment bindings and Connections now come from one shared walk of what the workflow uses, in core and in the UI; a build nothing reads no longer contributes values. The Poki game check reports a pass only for the answer shape it recognizes.
- a0ccd23: Simplify workflow creation and configuration: the new workflow wizard now has four steps (Name & description, Source & project path, Destinations, Review) with no Builds step, inline settings or notes, and non-clickable step headers. Providers choose which fields appear in the wizard with `showInWizard`. Configuration shows each provider's own icon, a compact destination list with expandable deployments and an inline Add deployment button, quieter status indicators with tooltips, an inline `$` button for environment variables, an auto-named workflow alias, and selects a Connection right after it is added from a field.
- 2ac814b: Expose workflow task IDs through a browser-safe entry point so shared release compilation does not load the Node.js process host in Desktop's renderer. Include a package-root declaration so TypeScript consumers using legacy Node resolution can use the documented subpath.
- 41752c1: Make local release builds and history more reliable: inspect Construct profiles from metadata without dropping valid custom profiles, wait for exports to finish preparing before downloading, and treat unmeasured artifact sizes as unknown instead of 0 B. Include useful status and screenshot details when an export stalls.
- c67d995: Harden release workflow, project, history, and UI persistence boundaries against malformed, concurrent, and disconnected state.
- 37a5319: Add translations for the Release Workspace project switcher, distinct Dashboard and Workflows pages, and recent execution overview.
- dbbad55: Keep dashboard Ship confirmation in dashboard context and cancel failed Ship intents with recovery actions.
- Updated dependencies [db2afdf]
- Updated dependencies [5817f0c]
- Updated dependencies [a38c96e]
- Updated dependencies [7df1907]
- Updated dependencies [42bf940]
- Updated dependencies [8c0b8a4]
- Updated dependencies [8c0b8a4]
- Updated dependencies [91b93b9]
- Updated dependencies [2ac814b]
- Updated dependencies [c67d995]
  - @pipelab/workflow-runtime@1.0.0-beta.2
  - @pipelab/constants@1.0.0-beta.35

## 1.0.0-beta.33

### Patch Changes

- fix construct export
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.34
  - @pipelab/migration@1.0.0-beta.32

## 1.0.0-beta.32

### Patch Changes

- -
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.33
  - @pipelab/migration@1.0.0-beta.31

## 1.0.0-beta.31

### Patch Changes

- improve dark theme and improve build history
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.32
  - @pipelab/migration@1.0.0-beta.30

## 1.0.0-beta.30

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.31
  - @pipelab/migration@1.0.0-beta.29

## 1.0.0-beta.29

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.30
  - @pipelab/migration@1.0.0-beta.28

## 1.0.0-beta.28

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.29
  - @pipelab/migration@1.0.0-beta.27

## 1.0.0-beta.27

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.28
  - @pipelab/migration@1.0.0-beta.26

## 1.0.0-beta.26

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.27
  - @pipelab/migration@1.0.0-beta.25

## 1.0.0-beta.25

### Patch Changes

- sdsd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.26
  - @pipelab/migration@1.0.0-beta.24

## 1.0.0-beta.24

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.25
  - @pipelab/migration@1.0.0-beta.23

## 1.0.0-beta.23

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.24
  - @pipelab/migration@1.0.0-beta.22

## 1.0.0-beta.22

### Patch Changes

- fix slashes

## 1.0.0-beta.21

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.23
  - @pipelab/migration@1.0.0-beta.21

## 1.0.0-beta.20

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.22
  - @pipelab/migration@1.0.0-beta.20

## 1.0.0-beta.19

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.21
  - @pipelab/migration@1.0.0-beta.19

## 1.0.0-beta.18

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.20
  - @pipelab/migration@1.0.0-beta.18

## 1.0.0-beta.17

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.19
  - @pipelab/migration@1.0.0-beta.17

## 1.0.0-beta.16

### Patch Changes

- df
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.18
  - @pipelab/migration@1.0.0-beta.16

## 1.0.0-beta.15

### Patch Changes

- sdsd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.17
  - @pipelab/migration@1.0.0-beta.15

## 1.0.0-beta.14

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.16
  - @pipelab/migration@1.0.0-beta.14

## 1.0.0-beta.13

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.15
  - @pipelab/migration@1.0.0-beta.13

## 1.0.0-beta.12

### Patch Changes

- qs
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.14
  - @pipelab/migration@1.0.0-beta.12

## 1.0.0-beta.11

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.13
  - @pipelab/migration@1.0.0-beta.11

## 1.0.0-beta.10

### Patch Changes

- s
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.12
  - @pipelab/migration@1.0.0-beta.10

## 1.0.0-beta.9

### Patch Changes

- fg
- Updated dependencies
  - @pipelab/migration@1.0.0-beta.9

## 1.0.0-beta.8

### Patch Changes

- changes
- Updated dependencies
  - @pipelab/migration@1.0.0-beta.8

## 1.0.0-beta.7

### Patch Changes

- bump
- Updated dependencies
  - @pipelab/migration@1.0.0-beta.7

## 1.0.0-beta.6

### Patch Changes

- fixes
- Updated dependencies
  - @pipelab/migration@1.0.0-beta.6

## 1.0.0-beta.5

### Patch Changes

- bump
- Updated dependencies
  - @pipelab/migration@1.0.0-beta.5

## 1.0.0-beta.4

### Patch Changes

- beta tag
- Updated dependencies
  - @pipelab/migration@1.0.0-beta.4

## 1.0.0-beta.3

### Patch Changes

- bump
- Updated dependencies
  - @pipelab/migration@1.0.0-beta.3

## 1.0.0-beta.2

### Patch Changes

- update
- Updated dependencies
  - @pipelab/migration@1.0.0-beta.2

## 1.0.0-beta.1

### Patch Changes

- general improvements
- Updated dependencies
  - @pipelab/migration@1.0.0-beta.1

## 1.0.0-beta.0

### Major Changes

- e1befbf: initial release

### Patch Changes

- Updated dependencies [e1befbf]
  - @pipelab/migration@1.0.0-beta.0
