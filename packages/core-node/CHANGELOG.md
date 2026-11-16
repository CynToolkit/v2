# @pipelab/core-node

## 1.0.0-beta.39

### Major Changes

- 16e41ea: Remove the legacy Pipeline editor, management commands, execution entry points, and Pipeline migration/import/export surfaces. Release workflows remain available in the UI and CLI.
- 5817f0c: Remove the ActionRunner/Action execution API and the workflow adapter. Plugin
  registries and plugin tests now use native WorkflowTask implementations.
- eabcc96: Remove the standalone GPU patching plugin and its **Patch binary** action from the bundled engine and default configuration. Existing pipelines using that action must remove it and enable Electron's **Patch executable** option. Saved pipelines are not automatically converted.

### Minor Changes

- 790ed8c: Add profile-scoped beforeBuild shell commands that run on isolated artifact copies before Electron packaging, with managed Node.js and pnpm plus run-scoped `PIPELAB_` environment variables.
- 5817f0c: Define the native Workflow task context and Pipelab services bundle, with native task test utilities for plugin Workflow tasks.
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
- b4a1a3d: Check the Construct login before a run starts, and add a Test connection button to Construct accounts.

  Steam App and Depot IDs must be digits (checked before a run), and the preflight checks that the account has the configured itch game, Poki game, and Steam App and Depot.

- 07f9a4d: Remove obsolete plugin marketplace APIs, dynamic registration state and ineffective
  provider enablement controls. Migrate settings to schema 8 while preserving real
  preferences and saved connections. Built-in providers ship together with Pipelab;
  integrations configure credentials and accounts on the Connections screen in shipped builds. Provider, Release and task IDs
  remain unchanged.
- b4a1a3d: feat: add a Test connection button to Connections. A rejected credential blocks saving; an unreachable service or an untestable connection type does not.
- c886643: Expose the Desktop workflow environment reader and provider requirement metadata through the desktop entry point. Give repeated release destinations saved workflow names so they remain easy to tell apart.
- b4a1a3d: Release builds no longer have enabled/disabled targets or a build on/off switch: every target an engine offers is listed with its own settings, and a target is used when a deployment slot or another build reads it. Deployment slots and Bundle inputs can pick any target of an existing build. Build engines can no longer be changed after creation. Empty deployment slots are filled only when a workflow is created and are never filled again at plan or run time.

### Patch Changes

- e17deee: Use the v2 repository for desktop releases and only select updates from the installed major version.
- db2afdf: Move Release Folder and ZIP providers into core so Release no longer depends on the Filesystem plugin. Generic filesystem and archive operations run as core workflow tasks. Keep `plugin-filesystem` for legacy Pipeline compatibility, and export reusable safe copy and remove helpers from `workflow-runtime`.
- a0ccd23: Add multi-input builds and a Bundle build that puts the outputs of several builds, for example the Windows, Linux and macOS builds, into one ZIP with one folder per input. Defaults now come from one central table (`RELEASE_DEFAULTS`), and the ZIP destination accepts a ZIP archive as well as a folder. Builds expose all their enabled targets but only the targets that a slot, Bundle or other build uses are built, and automatic builds target the current operating system.
- c4b77fa: Use `done` as the only startup completion event in the shared contract and reject duplicate Release source, producer, or destination IDs when building the core registry.
- 0980b8f: Preserve cloud function error messages and HTTP status when sending responses to the UI, so failed account plan checks show actionable errors.
- 00dff7e: Send the artifact output ID expected by the Cloud upload API when preparing and completing artifact uploads.
- a0ccd23: Construct is now a project source with its own build engine, like Godot. The web export is a Construct build that Electron, Tauri and Poki consume, and Pipelab adds it automatically with the packager when a destination needs it. Defaults pick the web engine that accepts the source. Construct's own Windows (WebView2), macOS (WKWebView) and Linux (CEF) exports are declared but unavailable for now.
- 7df1907: Preflight run-scoped environment and connection override values before workflow history or runtime setup. Resolve an immutable alias-to-field snapshot for provider tasks, redact resolved values, and pass the initiating client's environment through execution IPC. Let Itch upload tasks consume the run-scoped Itch API key and reject a missing key before Butler setup.
- eabcc96: Add the optional Electron `patchExecutable` configuration to patch packaged Windows executables with gpupatch v0.2.1 and request a high-performance GPU. Patching is disabled by default and runs before build outputs are published.
- abd5d55: Redesign the project dashboard around the latest release and recent runs, and make run history and multiple projects available on the Free plan. Only cloud features remain plan-gated.
- e4ba5e4: Map Cloud upload artifacts to supported output IDs before registering them.
- 7e15645: Add `pipelab workflow run --skip-persistence` to use temporary paths for run history, run outputs, and package/cache data.
- 42bf940: Desktop forwards exactly the environment variables a run resolves (embedded references included), using the same plan as the run; the UI no longer keeps its own list. Steam and itch.io ID validation ignores `${{ env.X }}` bindings, which are resolved at run time.
- 42471a6: The Desktop app now forwards the environment variables of every build a workflow really uses, including builds the planner wires implicitly, using the same plan as a run.
- 68dd2ae: A run's environment bindings and Connections now come from one shared walk of what the workflow uses, in core and in the UI; a build nothing reads no longer contributes values. The Poki game check reports a pass only for the answer shape it recognizes.
- 6bdb669: Clear each run's Pipelab-managed workspace, staging, and canonical cache folders with its history, while retaining unrelated content and preserving history when a workflow is active or cleanup fails.
- 8c0b8a4: Resolve task input references from the CLI process environment at run time and redact referenced values from workflow logs and results. Construct release workflows can use Doppler-provided credentials without saving them in workflow configuration.
- 6dbac15: Simplify first-time workflow setup to name, source, destinations, and a recap. Creation applies resolvable build defaults and routes users to the first required Configuration, Builds, or Connections action. The Configuration view highlights the first blocker with a contextual repair action and lets users move between blockers. Filter ZIP source selection to `.zip` files.
- f8cf082: Consolidate the seven built-in provider workspaces into `@pipelab/providers`, with isolated provider modules and tests. Workspace imports use the new package; saved provider, Release, task, and integration IDs remain unchanged, so Release configurations need no migration.
- a0ccd23: Simplify workflow creation and configuration: the new workflow wizard now has four steps (Name & description, Source & project path, Destinations, Review) with no Builds step, inline settings or notes, and non-clickable step headers. Providers choose which fields appear in the wizard with `showInWizard`. Configuration shows each provider's own icon, a compact destination list with expandable deployments and an inline Add deployment button, quieter status indicators with tooltips, an inline `$` button for environment variables, an auto-named workflow alias, and selects a Connection right after it is added from a field.
- 6fabeaa: Fix extraction stalling on larger deflated ZIP entries.
- 91b93b9: Authenticate each Desktop-launched CLI server on a per-launch loopback port before loading the UI.
- 8c0b8a4: Show the total elapsed workflow time in the CLI summary, avoid repeated timer updates in non-interactive output, and keep successful build-history writes out of normal info logs.
- c67d995: Keep workflow delivery results valid for strict history persistence and initialize missing connection data safely under concurrent starts.
- c67d995: Harden release workflow, project, history, and UI persistence boundaries against malformed, concurrent, and disconnected state.
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

- Updated dependencies [790ed8c]
- Updated dependencies [a769376]
- Updated dependencies [16e41ea]
- Updated dependencies [8c0b8a4]
- Updated dependencies [db2afdf]
- Updated dependencies [dbbad55]
- Updated dependencies [8c0b8a4]
- Updated dependencies [5817f0c]
- Updated dependencies [6fabeaa]
- Updated dependencies [a0ccd23]
- Updated dependencies [ed5dfc8]
- Updated dependencies [21ebef4]
- Updated dependencies [a38c96e]
- Updated dependencies [2ef8f75]
- Updated dependencies [6d54e76]
- Updated dependencies [2ac814b]
- Updated dependencies [c4b77fa]
- Updated dependencies [6fabeaa]
- Updated dependencies [1a38588]
- Updated dependencies [e4ba5e4]
- Updated dependencies [a0ccd23]
- Updated dependencies [b4a1a3d]
- Updated dependencies [f65ddfa]
- Updated dependencies [7613cf6]
- Updated dependencies [7df1907]
- Updated dependencies [eabcc96]
- Updated dependencies [abd5d55]
- Updated dependencies [cc8a2af]
- Updated dependencies [8c0b8a4]
- Updated dependencies [07f9a4d]
- Updated dependencies [612df89]
- Updated dependencies [42471a6]
- Updated dependencies [5817f0c]
- Updated dependencies [42bf940]
- Updated dependencies [68dd2ae]
- Updated dependencies [8c0b8a4]
- Updated dependencies [8c0b8a4]
- Updated dependencies [8c0b8a4]
- Updated dependencies [b4a1a3d]
- Updated dependencies [f8cf082]
- Updated dependencies [3d392e6]
- Updated dependencies [a0ccd23]
- Updated dependencies [eabcc96]
- Updated dependencies [6fabeaa]
- Updated dependencies [91b93b9]
- Updated dependencies [2ac814b]
- Updated dependencies [c886643]
- Updated dependencies [41752c1]
- Updated dependencies [6fabeaa]
- Updated dependencies [c67d995]
- Updated dependencies [c67d995]
- Updated dependencies [b4a1a3d]
- Updated dependencies [ed12e98]
- Updated dependencies [2ac814b]
- Updated dependencies [37a5319]
- Updated dependencies [6bbad43]
- Updated dependencies [dbbad55]
- Updated dependencies [8797017]
- Updated dependencies [6dbac15]
- Updated dependencies [6dbac15]
- Updated dependencies [b322d2c]
  - @pipelab/shared@1.0.0-beta.34
  - @pipelab/providers@1.0.0-beta.1
  - @pipelab/workflow-runtime@1.0.0-beta.2
  - @pipelab/plugin-core@1.0.0-beta.40
  - @pipelab/constants@1.0.0-beta.35

## 1.0.0-beta.38

### Patch Changes

- fix construct export
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.34
  - @pipelab/shared@1.0.0-beta.33

## 1.0.0-beta.37

### Patch Changes

- -
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.33
  - @pipelab/shared@1.0.0-beta.32

## 1.0.0-beta.36

### Patch Changes

- improve dark theme and improve build history
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.32
  - @pipelab/shared@1.0.0-beta.31

## 1.0.0-beta.35

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.31
  - @pipelab/shared@1.0.0-beta.30

## 1.0.0-beta.34

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.30
  - @pipelab/shared@1.0.0-beta.29

## 1.0.0-beta.33

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.29
  - @pipelab/shared@1.0.0-beta.28

## 1.0.0-beta.32

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.28
  - @pipelab/shared@1.0.0-beta.27

## 1.0.0-beta.31

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.27
  - @pipelab/shared@1.0.0-beta.26

## 1.0.0-beta.30

### Patch Changes

- sdsd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.26
  - @pipelab/shared@1.0.0-beta.25

## 1.0.0-beta.29

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.25
  - @pipelab/shared@1.0.0-beta.24

## 1.0.0-beta.28

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.24
  - @pipelab/shared@1.0.0-beta.23

## 1.0.0-beta.27

### Patch Changes

- fix install

## 1.0.0-beta.26

### Patch Changes

- Updated dependencies
  - @pipelab/shared@1.0.0-beta.22

## 1.0.0-beta.25

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.23
  - @pipelab/shared@1.0.0-beta.21

## 1.0.0-beta.24

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.22
  - @pipelab/shared@1.0.0-beta.20

## 1.0.0-beta.23

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.21
  - @pipelab/shared@1.0.0-beta.19

## 1.0.0-beta.22

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.20
  - @pipelab/shared@1.0.0-beta.18

## 1.0.0-beta.21

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.19
  - @pipelab/shared@1.0.0-beta.17

## 1.0.0-beta.20

### Patch Changes

- df
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.18
  - @pipelab/shared@1.0.0-beta.16

## 1.0.0-beta.19

### Patch Changes

- sdsd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.17
  - @pipelab/shared@1.0.0-beta.15

## 1.0.0-beta.18

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.16
  - @pipelab/shared@1.0.0-beta.14

## 1.0.0-beta.17

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.15
  - @pipelab/shared@1.0.0-beta.13

## 1.0.0-beta.16

### Patch Changes

- qs
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.14
  - @pipelab/shared@1.0.0-beta.12

## 1.0.0-beta.15

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.13
  - @pipelab/shared@1.0.0-beta.11

## 1.0.0-beta.14

### Patch Changes

- s
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.12
  - @pipelab/shared@1.0.0-beta.10

## 1.0.0-beta.13

### Patch Changes

- fg
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.11
  - @pipelab/shared@1.0.0-beta.9

## 1.0.0-beta.12

### Patch Changes

- changes
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.10
  - @pipelab/shared@1.0.0-beta.8

## 1.0.0-beta.11

### Patch Changes

- bump
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.9
  - @pipelab/shared@1.0.0-beta.7

## 1.0.0-beta.10

### Patch Changes

- fixes
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.8
  - @pipelab/shared@1.0.0-beta.6

## 1.0.0-beta.9

### Patch Changes

- Updated dependencies
  - @pipelab/constants@1.0.0-beta.7

## 1.0.0-beta.8

### Patch Changes

- fix package installation

## 1.0.0-beta.7

### Patch Changes

- bump
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.6
  - @pipelab/shared@1.0.0-beta.5

## 1.0.0-beta.6

### Patch Changes

- beta tag
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.5
  - @pipelab/shared@1.0.0-beta.4

## 1.0.0-beta.5

### Patch Changes

- bump
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.4
  - @pipelab/shared@1.0.0-beta.3

## 1.0.0-beta.4

### Patch Changes

- Updated dependencies
  - @pipelab/constants@1.0.0-beta.3

## 1.0.0-beta.3

### Patch Changes

- update
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.2
  - @pipelab/shared@1.0.0-beta.2

## 1.0.0-beta.2

### Patch Changes

- general improvements
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.1
  - @pipelab/shared@1.0.0-beta.1

## 1.0.0-beta.1

### Patch Changes

- improve update checks

## 1.0.0-beta.0

### Major Changes

- e1befbf: initial release

### Patch Changes

- Updated dependencies [e1befbf]
  - @pipelab/constants@1.0.0-beta.0
  - @pipelab/shared@1.0.0-beta.0
