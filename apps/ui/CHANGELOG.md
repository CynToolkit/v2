# @pipelab/ui

## 2.0.0-beta.39

### Major Changes

- 16e41ea: Remove the legacy Pipeline editor, management commands, execution entry points, and Pipeline migration/import/export surfaces. Release workflows remain available in the UI and CLI.

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

- dbbad55: Add a dashboard Ship action for saved workflows and localize its labels.
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
- 3177139: Improve release workflow creation, configuration, build management, and artifact discovery.
- b4a1a3d: feat: add a Test connection button to Connections. A rejected credential blocks saving; an unreachable service or an untestable connection type does not.
- b4a1a3d: Release builds no longer have enabled/disabled targets or a build on/off switch: every target an engine offers is listed with its own settings, and a target is used when a deployment slot or another build reads it. Deployment slots and Bundle inputs can pick any target of an existing build. Build engines can no longer be changed after creation. Empty deployment slots are filled only when a workflow is created and are never filled again at plan or run time.
- ed12e98: Package built-in Release provider specifications with the browser UI and mark host-dependent checks as requiring the agent.
- e100f8c: feat: support hosted browser authentication and billing

  Hosted browser users can manage their account and billing without a local agent, with safe verification and password-reset callbacks.

### Patch Changes

- 174d17d: Improve startup loading and agent connection states, and wait for initial route data before showing the app.
- a0ccd23: Add multi-input builds and a Bundle build that puts the outputs of several builds, for example the Windows, Linux and macOS builds, into one ZIP with one folder per input. Defaults now come from one central table (`RELEASE_DEFAULTS`), and the ZIP destination accepts a ZIP archive as well as a folder. Builds expose all their enabled targets but only the targets that a slot, Bundle or other build uses are built, and automatic builds target the current operating system.
- 21ebef4: Polish the UI: highlight the active step in the new workflow wizard, add proper empty states with actions for Workflows and Connections, align Cloud files with the other pages, and replace the placeholder Team page.
- 2ef8f75: Polish the workflow catalog with clearer actions, readable provider fallbacks, and actionable load errors.
- e4ba5e4: Use the app theme tokens for readable Cloud Files cards and controls in light and dark mode.
- abd5d55: Redesign the project dashboard around the latest release and recent runs, and make run history and multiple projects available on the Free plan. Only cloud features remain plan-gated.
- 6dbac15: Load icon fonts when the UI development server runs in a worktree with shared, symlinked dependencies.
- 07f9a4d: Remove obsolete plugin marketplace APIs, dynamic registration state and ineffective
  provider enablement controls. Migrate settings to schema 8 while preserving real
  preferences and saved connections. Built-in providers ship together with Pipelab;
  integrations configure credentials and accounts on the Connections screen in shipped builds. Provider, Release and task IDs
  remain unchanged.
- 42bf940: Desktop forwards exactly the environment variables a run resolves (embedded references included), using the same plan as the run; the UI no longer keeps its own list. Steam and itch.io ID validation ignores `${{ env.X }}` bindings, which are resolved at run time.
- 68dd2ae: A run's environment bindings and Connections now come from one shared walk of what the workflow uses, in core and in the UI; a build nothing reads no longer contributes values. The Poki game check reports a pass only for the answer shape it recognizes.
- 0980b8f: Show navigation immediately while the agent connects, load screen data concurrently with local loading and retry states, and check subscriptions in the background.
  Show the original themed Pipelab logo loader while interface files download, mount persistent navigation before the current screen loads, and defer closed dialogs. Load fonts without delaying the first paint and expose subscription lookup errors with a retry action.
  Allow config requests to recover after an unavailable first attempt, preserve concurrent request deduplication, and offer retry when reconnecting an open workflow fails without discarding its unsaved draft.
- 6dbac15: Simplify first-time workflow setup to name, source, destinations, and a recap. Creation applies resolvable build defaults and routes users to the first required Configuration, Builds, or Connections action. The Configuration view highlights the first blocker with a contextual repair action and lets users move between blockers. Filter ZIP source selection to `.zip` files.
- a0ccd23: Simplify workflow creation and configuration: the new workflow wizard now has four steps (Name & description, Source & project path, Destinations, Review) with no Builds step, inline settings or notes, and non-clickable step headers. Providers choose which fields appear in the wizard with `showInWizard`. Configuration shows each provider's own icon, a compact destination list with expandable deployments and an inline Add deployment button, quieter status indicators with tooltips, an inline `$` button for environment variables, an auto-named workflow alias, and selects a Connection right after it is added from a field.
- 91b93b9: Authenticate each Desktop-launched CLI server on a per-launch loopback port before loading the UI.
- c67d995: Harden release workflow, project, history, and UI persistence boundaries against malformed, concurrent, and disconnected state.
- 0980b8f: Fix the home redirect to use the dashboard route's lowercase URL.
- dbbad55: Keep dashboard Ship confirmation in dashboard context and cancel failed Ship intents with recovery actions.
- 6dbac15: The new-release wizard collects a name and description first, then the source and required project path. Construct and Godot use their provider icons.
- Updated dependencies [790ed8c]
- Updated dependencies [a769376]
- Updated dependencies [16e41ea]
- Updated dependencies [dbbad55]
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
- Updated dependencies [abd5d55]
- Updated dependencies [07f9a4d]
- Updated dependencies [5817f0c]
- Updated dependencies [68dd2ae]
- Updated dependencies [b4a1a3d]
- Updated dependencies [a0ccd23]
- Updated dependencies [eabcc96]
- Updated dependencies [91b93b9]
- Updated dependencies [2ac814b]
- Updated dependencies [c886643]
- Updated dependencies [41752c1]
- Updated dependencies [c67d995]
- Updated dependencies [b4a1a3d]
- Updated dependencies [ed12e98]
- Updated dependencies [37a5319]
- Updated dependencies [dbbad55]
- Updated dependencies [b322d2c]
  - @pipelab/shared@1.0.0-beta.34
  - @pipelab/constants@1.0.0-beta.35

## 2.0.0-beta.38

### Patch Changes

- fix construct export
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.34
  - @pipelab/shared@1.0.0-beta.33

## 2.0.0-beta.37

### Patch Changes

- -
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.33
  - @pipelab/shared@1.0.0-beta.32

## 2.0.0-beta.36

### Patch Changes

- improve dark theme and improve build history
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.32
  - @pipelab/shared@1.0.0-beta.31

## 2.0.0-beta.35

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.31
  - @pipelab/shared@1.0.0-beta.30

## 2.0.0-beta.34

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.30
  - @pipelab/shared@1.0.0-beta.29

## 2.0.0-beta.33

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.29
  - @pipelab/shared@1.0.0-beta.28

## 2.0.0-beta.32

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.28
  - @pipelab/shared@1.0.0-beta.27

## 2.0.0-beta.31

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.27
  - @pipelab/shared@1.0.0-beta.26

## 2.0.0-beta.30

### Patch Changes

- sdsd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.26
  - @pipelab/shared@1.0.0-beta.25

## 2.0.0-beta.29

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.25
  - @pipelab/shared@1.0.0-beta.24

## 2.0.0-beta.28

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.24
  - @pipelab/shared@1.0.0-beta.23

## 2.0.0-beta.27

## 2.0.0-beta.26

### Patch Changes

- fix slashes
- Updated dependencies
  - @pipelab/shared@1.0.0-beta.22

## 2.0.0-beta.25

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.23
  - @pipelab/shared@1.0.0-beta.21

## 2.0.0-beta.24

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.22
  - @pipelab/shared@1.0.0-beta.20

## 2.0.0-beta.23

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.21
  - @pipelab/shared@1.0.0-beta.19

## 2.0.0-beta.22

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.20
  - @pipelab/shared@1.0.0-beta.18

## 2.0.0-beta.21

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.19
  - @pipelab/shared@1.0.0-beta.17

## 2.0.0-beta.20

### Patch Changes

- df
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.18
  - @pipelab/shared@1.0.0-beta.16

## 2.0.0-beta.19

### Patch Changes

- sdsd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.17
  - @pipelab/shared@1.0.0-beta.15

## 2.0.0-beta.18

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.16
  - @pipelab/shared@1.0.0-beta.14

## 2.0.0-beta.17

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.15
  - @pipelab/shared@1.0.0-beta.13

## 2.0.0-beta.16

### Patch Changes

- qs
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.14
  - @pipelab/shared@1.0.0-beta.12

## 2.0.0-beta.15

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.13
  - @pipelab/shared@1.0.0-beta.11

## 2.0.0-beta.14

### Patch Changes

- s
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.12
  - @pipelab/shared@1.0.0-beta.10

## 2.0.0-beta.13

### Patch Changes

- fg
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.11
  - @pipelab/shared@1.0.0-beta.9

## 2.0.0-beta.12

### Patch Changes

- changes
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.10
  - @pipelab/shared@1.0.0-beta.8

## 2.0.0-beta.11

### Patch Changes

- bump
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.9
  - @pipelab/shared@1.0.0-beta.7

## 2.0.0-beta.10

### Patch Changes

- fixes
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.8
  - @pipelab/shared@1.0.0-beta.6

## 2.0.0-beta.9

### Patch Changes

- Updated dependencies
  - @pipelab/constants@1.0.0-beta.7

## 2.0.0-beta.8

## 2.0.0-beta.7

### Patch Changes

- bump
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.6
  - @pipelab/shared@1.0.0-beta.5

## 2.0.0-beta.6

### Patch Changes

- beta tag
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.5
  - @pipelab/shared@1.0.0-beta.4

## 2.0.0-beta.5

### Patch Changes

- bump
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.4
  - @pipelab/shared@1.0.0-beta.3

## 2.0.0-beta.4

### Patch Changes

- Updated dependencies
  - @pipelab/constants@1.0.0-beta.3

## 2.0.0-beta.3

### Patch Changes

- update
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.2
  - @pipelab/shared@1.0.0-beta.2

## 2.0.0-beta.2

### Patch Changes

- general improvements
- Updated dependencies
  - @pipelab/constants@1.0.0-beta.1
  - @pipelab/shared@1.0.0-beta.1

## 2.0.0-beta.1

## 2.0.0-beta.0

### Major Changes

- e1befbf: initial release

### Patch Changes

- Updated dependencies [e1befbf]
  - @pipelab/constants@1.0.0-beta.0
  - @pipelab/shared@1.0.0-beta.0
