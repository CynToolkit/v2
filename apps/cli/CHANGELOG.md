# @pipelab/cli

## 2.0.0-beta.39

### Major Changes

- 16e41ea: Remove the legacy Pipeline editor, management commands, execution entry points, and Pipeline migration/import/export surfaces. Release workflows remain available in the UI and CLI.

### Minor Changes

- 790ed8c: Add profile-scoped beforeBuild shell commands that run on isolated artifact copies before Electron packaging, with managed Node.js and pnpm plus run-scoped `PIPELAB_` environment variables.
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
- b4a1a3d: feat: add a Test connection button to Connections. A rejected credential blocks saving; an unreachable service or an untestable connection type does not.
- b4a1a3d: Release builds no longer have enabled/disabled targets or a build on/off switch: every target an engine offers is listed with its own settings, and a target is used when a deployment slot or another build reads it. Deployment slots and Bundle inputs can pick any target of an existing build. Build engines can no longer be changed after creation. Empty deployment slots are filled only when a workflow is created and are never filled again at plan or run time.
- 613da41: Run portable Release Workflows from JSON files with repeatable run-scoped `--connection` field mappings.

### Patch Changes

- 07f9a4d: Remove obsolete plugin marketplace APIs, dynamic registration state and ineffective
  provider enablement controls. Migrate settings to schema 8 while preserving real
  preferences and saved connections. Built-in providers ship together with Pipelab;
  integrations configure credentials and accounts on the Connections screen in shipped builds. Provider, Release and task IDs
  remain unchanged.
- 8c0b8a4: Group workflow run tasks by source, build profile, destination, and deployment slot.
- 7e15645: Add `pipelab workflow run --skip-persistence` to use temporary paths for run history, run outputs, and package/cache data.
- 8c0b8a4: Keep workflow artifact paths intact in returned results while redacting them
  from events, require Construct credentials as a complete pair, keep the managed
  browser profile private on POSIX systems, and bound interactive timing refreshes.
- f8cf082: Consolidate the seven built-in provider workspaces into `@pipelab/providers`, with isolated provider modules and tests. Workspace imports use the new package; saved provider, Release, task, and integration IDs remain unchanged, so Release configurations need no migration.
- 91b93b9: Authenticate each Desktop-launched CLI server on a per-launch loopback port before loading the UI.
- 8c0b8a4: Show the total elapsed workflow time in the CLI summary, avoid repeated timer updates in non-interactive output, and keep successful build-history writes out of normal info logs.
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

- 5428b1f: Keep workflow step and overall failure statuses accurate in CLI output.
- Updated dependencies [790ed8c]
- Updated dependencies [e17deee]
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
- Updated dependencies [0980b8f]
- Updated dependencies [6fabeaa]
- Updated dependencies [1a38588]
- Updated dependencies [e4ba5e4]
- Updated dependencies [00dff7e]
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
- Updated dependencies [e4ba5e4]
- Updated dependencies [5817f0c]
- Updated dependencies [7e15645]
- Updated dependencies [42bf940]
- Updated dependencies [42471a6]
- Updated dependencies [68dd2ae]
- Updated dependencies [6bdb669]
- Updated dependencies [8c0b8a4]
- Updated dependencies [8c0b8a4]
- Updated dependencies [6dbac15]
- Updated dependencies [b4a1a3d]
- Updated dependencies [f8cf082]
- Updated dependencies [3d392e6]
- Updated dependencies [a0ccd23]
- Updated dependencies [6fabeaa]
- Updated dependencies [eabcc96]
- Updated dependencies [6fabeaa]
- Updated dependencies [91b93b9]
- Updated dependencies [2ac814b]
- Updated dependencies [c886643]
- Updated dependencies [8c0b8a4]
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
  - @pipelab/core-node@1.0.0-beta.39
  - @pipelab/providers@1.0.0-beta.1
  - @pipelab/workflow-runtime@1.0.0-beta.2
  - @pipelab/constants@1.0.0-beta.35

## 2.0.0-beta.38

### Patch Changes

- fix construct export
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.34
  - @pipelab/core-node@1.0.0-beta.38
  - @pipelab/shared@1.0.0-beta.33

## 2.0.0-beta.37

### Patch Changes

- -
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.33
  - @pipelab/core-node@1.0.0-beta.37
  - @pipelab/shared@1.0.0-beta.32

## 2.0.0-beta.36

### Patch Changes

- improve dark theme and improve build history
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.32
  - @pipelab/core-node@1.0.0-beta.36
  - @pipelab/shared@1.0.0-beta.31

## 2.0.0-beta.35

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.31
  - @pipelab/core-node@1.0.0-beta.35
  - @pipelab/shared@1.0.0-beta.30

## 2.0.0-beta.34

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.30
  - @pipelab/core-node@1.0.0-beta.34
  - @pipelab/shared@1.0.0-beta.29

## 2.0.0-beta.33

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.29
  - @pipelab/core-node@1.0.0-beta.33
  - @pipelab/shared@1.0.0-beta.28

## 2.0.0-beta.32

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.28
  - @pipelab/core-node@1.0.0-beta.32
  - @pipelab/shared@1.0.0-beta.27

## 2.0.0-beta.31

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.27
  - @pipelab/core-node@1.0.0-beta.31
  - @pipelab/shared@1.0.0-beta.26

## 2.0.0-beta.30

### Patch Changes

- sdsd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.26
  - @pipelab/core-node@1.0.0-beta.30
  - @pipelab/shared@1.0.0-beta.25

## 2.0.0-beta.29

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.25
  - @pipelab/core-node@1.0.0-beta.29
  - @pipelab/shared@1.0.0-beta.24

## 2.0.0-beta.28

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.24
  - @pipelab/core-node@1.0.0-beta.28
  - @pipelab/shared@1.0.0-beta.23

## 2.0.0-beta.27

### Patch Changes

- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.27

## 2.0.0-beta.26

### Patch Changes

- Updated dependencies
  - @pipelab/shared@1.0.0-beta.22
  - @pipelab/core-node@1.0.0-beta.26

## 2.0.0-beta.25

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.23
  - @pipelab/core-node@1.0.0-beta.25
  - @pipelab/shared@1.0.0-beta.21

## 2.0.0-beta.24

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.22
  - @pipelab/core-node@1.0.0-beta.24
  - @pipelab/shared@1.0.0-beta.20

## 2.0.0-beta.23

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.21
  - @pipelab/core-node@1.0.0-beta.23
  - @pipelab/shared@1.0.0-beta.19

## 2.0.0-beta.22

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.20
  - @pipelab/core-node@1.0.0-beta.22
  - @pipelab/shared@1.0.0-beta.18

## 2.0.0-beta.21

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.19
  - @pipelab/core-node@1.0.0-beta.21
  - @pipelab/shared@1.0.0-beta.17

## 2.0.0-beta.20

### Patch Changes

- df
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.18
  - @pipelab/core-node@1.0.0-beta.20
  - @pipelab/shared@1.0.0-beta.16

## 2.0.0-beta.19

### Patch Changes

- sdsd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.17
  - @pipelab/core-node@1.0.0-beta.19
  - @pipelab/shared@1.0.0-beta.15

## 2.0.0-beta.18

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.16
  - @pipelab/core-node@1.0.0-beta.18
  - @pipelab/shared@1.0.0-beta.14

## 2.0.0-beta.17

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.15
  - @pipelab/core-node@1.0.0-beta.17
  - @pipelab/shared@1.0.0-beta.13

## 2.0.0-beta.16

### Patch Changes

- qs
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.14
  - @pipelab/core-node@1.0.0-beta.16
  - @pipelab/shared@1.0.0-beta.12

## 2.0.0-beta.15

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.13
  - @pipelab/core-node@1.0.0-beta.15
  - @pipelab/shared@1.0.0-beta.11

## 2.0.0-beta.14

### Patch Changes

- s
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.12
  - @pipelab/core-node@1.0.0-beta.14
  - @pipelab/shared@1.0.0-beta.10

## 2.0.0-beta.13

### Patch Changes

- fg
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.11
  - @pipelab/core-node@1.0.0-beta.13
  - @pipelab/shared@1.0.0-beta.9

## 2.0.0-beta.12

### Patch Changes

- changes
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.10
  - @pipelab/core-node@1.0.0-beta.12
  - @pipelab/shared@1.0.0-beta.8

## 2.0.0-beta.11

### Patch Changes

- bump
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.9
  - @pipelab/core-node@1.0.0-beta.11
  - @pipelab/shared@1.0.0-beta.7

## 2.0.0-beta.10

### Patch Changes

- fixes
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.8
  - @pipelab/core-node@1.0.0-beta.10
  - @pipelab/shared@1.0.0-beta.6

## 2.0.0-beta.9

### Patch Changes

- Updated dependencies
  - @pipelab/constants@1.0.0-beta.7
  - @pipelab/core-node@1.0.0-beta.9

## 2.0.0-beta.8

### Patch Changes

- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.8

## 2.0.0-beta.7

### Patch Changes

- bump
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.6
  - @pipelab/core-node@1.0.0-beta.7
  - @pipelab/shared@1.0.0-beta.5

## 2.0.0-beta.6

### Patch Changes

- beta tag
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.5
  - @pipelab/core-node@1.0.0-beta.6
  - @pipelab/shared@1.0.0-beta.4

## 2.0.0-beta.5

### Patch Changes

- bump
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.4
  - @pipelab/core-node@1.0.0-beta.5
  - @pipelab/shared@1.0.0-beta.3

## 2.0.0-beta.4

### Patch Changes

- Updated dependencies
  - @pipelab/constants@1.0.0-beta.3
  - @pipelab/core-node@1.0.0-beta.4

## 2.0.0-beta.3

### Patch Changes

- update
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.2
  - @pipelab/core-node@1.0.0-beta.3
  - @pipelab/shared@1.0.0-beta.2

## 2.0.0-beta.2

### Patch Changes

- general improvements
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.1
  - @pipelab/core-node@1.0.0-beta.2
  - @pipelab/shared@1.0.0-beta.1

## 2.0.0-beta.1

### Patch Changes

- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.1

## 2.0.0-beta.0

### Major Changes

- e1befbf: initial release

### Patch Changes

- Updated dependencies [e1befbf]
  - @pipelab/constants@1.0.0-beta.0
  - @pipelab/core-node@1.0.0-beta.0
  - @pipelab/shared@1.0.0-beta.0
