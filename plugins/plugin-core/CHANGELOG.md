# @pipelab/plugin-core

## 1.0.0-beta.40

### Major Changes

- 5817f0c: Remove the ActionRunner/Action execution API and the workflow adapter. Plugin
  registries and plugin tests now use native WorkflowTask implementations.
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

### Minor Changes

- eabcc96: Add the optional Electron `patchExecutable` configuration to patch packaged Windows executables with gpupatch v0.2.1 and request a high-performance GPU. Patching is disabled by default and runs before build outputs are published.

### Patch Changes

- 07f9a4d: Remove obsolete plugin marketplace APIs, dynamic registration state and ineffective
  provider enablement controls. Migrate settings to schema 8 while preserving real
  preferences and saved connections. Built-in providers ship together with Pipelab;
  integrations configure credentials and accounts on the Connections screen in shipped builds. Provider, Release and task IDs
  remain unchanged.
- 8c0b8a4: Skip npm metadata resolution when an exact requested package version is already installed in the local cache.
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
- Updated dependencies [abd5d55]
- Updated dependencies [07f9a4d]
- Updated dependencies [5817f0c]
- Updated dependencies [42bf940]
- Updated dependencies [68dd2ae]
- Updated dependencies [8c0b8a4]
- Updated dependencies [8c0b8a4]
- Updated dependencies [b4a1a3d]
- Updated dependencies [a0ccd23]
- Updated dependencies [eabcc96]
- Updated dependencies [2ac814b]
- Updated dependencies [c886643]
- Updated dependencies [41752c1]
- Updated dependencies [c67d995]
- Updated dependencies [c67d995]
- Updated dependencies [b4a1a3d]
- Updated dependencies [ed12e98]
- Updated dependencies [37a5319]
- Updated dependencies [dbbad55]
- Updated dependencies [b322d2c]
  - @pipelab/shared@1.0.0-beta.34
  - @pipelab/workflow-runtime@1.0.0-beta.2

## 1.0.0-beta.39

### Patch Changes

- fix construct export
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.38

## 1.0.0-beta.38

### Patch Changes

- -
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.37

## 1.0.0-beta.37

### Patch Changes

- improve dark theme and improve build history
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.36

## 1.0.0-beta.36

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.35

## 1.0.0-beta.35

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.34

## 1.0.0-beta.34

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.33

## 1.0.0-beta.33

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.32

## 1.0.0-beta.32

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.31

## 1.0.0-beta.31

### Patch Changes

- sdsd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.30

## 1.0.0-beta.30

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.29

## 1.0.0-beta.29

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.28

## 1.0.0-beta.28

### Patch Changes

- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.27

## 1.0.0-beta.27

### Patch Changes

- @pipelab/core-node@1.0.0-beta.26

## 1.0.0-beta.26

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.25

## 1.0.0-beta.25

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.24

## 1.0.0-beta.24

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.23

## 1.0.0-beta.23

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.22

## 1.0.0-beta.22

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.21

## 1.0.0-beta.21

### Patch Changes

- df
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.20

## 1.0.0-beta.20

### Patch Changes

- sdsd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.19

## 1.0.0-beta.19

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.18

## 1.0.0-beta.18

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.17

## 1.0.0-beta.17

### Patch Changes

- qs
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.16

## 1.0.0-beta.16

### Patch Changes

- sd
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.15

## 1.0.0-beta.15

### Patch Changes

- s
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.14

## 1.0.0-beta.14

### Patch Changes

- fg
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.13

## 1.0.0-beta.13

### Patch Changes

- changes
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.12

## 1.0.0-beta.12

### Patch Changes

- bump
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.11

## 1.0.0-beta.11

### Patch Changes

- add shims

## 1.0.0-beta.10

### Patch Changes

- fixes
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.10

## 1.0.0-beta.9

### Patch Changes

- @pipelab/core-node@1.0.0-beta.9

## 1.0.0-beta.8

### Patch Changes

- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.8

## 1.0.0-beta.7

### Patch Changes

- bump
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.7

## 1.0.0-beta.6

### Patch Changes

- beta tag
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.6

## 1.0.0-beta.5

### Patch Changes

- bump
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.5

## 1.0.0-beta.4

### Patch Changes

- @pipelab/core-node@1.0.0-beta.4

## 1.0.0-beta.3

### Patch Changes

- update
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.3

## 1.0.0-beta.2

### Patch Changes

- general improvements
- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.2

## 1.0.0-beta.1

### Patch Changes

- Updated dependencies
  - @pipelab/core-node@1.0.0-beta.1

## 1.0.0-beta.0

### Major Changes

- e1befbf: initial release

### Patch Changes

- Updated dependencies [e1befbf]
  - @pipelab/core-node@1.0.0-beta.0
