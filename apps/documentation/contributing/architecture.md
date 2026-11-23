# Contributor architecture and package ownership

This is an implementation map for contributors, not a promise of a stable public SDK. The product-facing explanation of app startup and execution paths is in [How Pipelab runs your work](/guide/architecture).

## Workspace boundaries

| Area                        | Owns                                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/desktop`              | Electron lifecycle, native dialogs/shell integration, preload bridge, and IPC handlers. It starts the local CLI server process.             |
| `apps/ui`                   | Vue interface, Release workflow editor, and browser-side API calls.                                                                         |
| `apps/cli`                  | CLI entry point, command registration, and packaged executable bundle. The Node server and execution handlers are implemented in core-node. |
| `packages/core-node`        | Node-side context, HTTP/WebSocket server, handlers, build history, persistence, and adapters that host providers/workflows.                 |
| `packages/shared`           | Shared types, schemas, configuration, provider definitions, and Release workflow planning/compiler contracts.                               |
| `packages/workflow-runtime` | Host-abstracted version 1 task execution contracts and runtime.                                                                             |
| `packages/providers`        | Construct, Electron, Godot, Tauri, Steam, Itch, and Poki implementations and tests, isolated in provider folders and versioned together.    |
| `packages/plugin-core`      | Generic filesystem, archive, download, process and package helpers below providers; no core-node dependency.                                |
| `workers/*`, `supabase/`    | Cloudflare Worker APIs and database migrations/functions for cloud services.                                                                |

Core-node's single `builtInProviders` list drives renderer metadata, Release definitions, and native Workflow task registration. Each module exports one `ProviderDefinition` combining its metadata, integrations, Release contributions, and task factories. See [Workflow runtime](/reference/workflow-runtime).

## Runtime boundaries

The desktop process bundles the CLI package (`@pipelab/cli/serve`) into `server-entry.js`, runs it as a supervised child process (its own process group on Unix), and on a crash kills everything it started and restarts it. In production, the server serves bundled UI assets and accepts UI requests over WebSocket. The UI's native operations go through Electron IPC exposed by preload. `pipelab serve` defaults to `127.0.0.1`; remote binding requires authentication in production. The CLI exposes saved Release workflow commands.

For cloud artifacts, core-node is the client/host adapter, `workers/pipelab-cloud` owns authenticated API validation and signed transfer operations, and Supabase migrations define persisted metadata and cleanup state. Keep credentials and provider-specific request behavior within those owning boundaries.

## Public package imports

Workspace package manifests declare their supported exports. The shared libraries `@pipelab/core-node`, `@pipelab/shared`, and `@pipelab/workflow-runtime` expose the package root (`.`); do not deep-import `src` files or assume undeclared subpaths are supported. For example:

```ts
import { runWorkflow, createLocalHost } from "@pipelab/workflow-runtime";
```

Check the owning package's `package.json`, `src/index.ts`, README, and scripts before changing or consuming an interface. These workspace exports are not evidence of a supported external SDK stability policy.

`@pipelab/providers` exports the seven named built-in definitions from its root,
with one public entry point exposing provider definitions and selected host helpers.
Provider folders remain independently testable with scripts such as
`pnpm --filter @pipelab/providers test:construct`. Their saved provider, Release,
and Workflow task IDs retain the `@pipelab/plugin-*` prefix; moving the code does
not require a Release configuration migration.

## Adding or changing behavior

- Put provider-specific task behavior and tests in its owning `packages/providers/src/<provider>` folder. The package root exports definitions; core-node owns built-in composition.
- Keep shared contracts and schemas in `packages/shared`; keep Node server, persistence, and host adapters in `packages/core-node`.
- Implement generic scheduling/host contracts in `packages/workflow-runtime`; register Pipelab-specific tasks at the core-node boundary.
- Keep cloud HTTP protocol logic in the Worker/client boundary and update the related tests when either side changes.
- Update product documentation with user-visible behavior. Use the package's own tests, typecheck, and build scripts as appropriate.

## Execution dependency direction

The runtime is independent of Pipelab integrations. Shared provider contracts
build on it; the existing helper package implements reusable execution utilities.
Providers use those layers, and core-node composes and hosts the providers.

```text
workflow-runtime → shared/provider API → plugin-core helpers → providers → core-node
```

Arrows here mean “is used by.” Providers do not import core-node. The host supplies
managed temporary/cache/package/connection paths, Node and pnpm installation,
and bundled asset resolution through `ProviderHostContext`. Provider utilities
such as SteamCMD, Butler and web export detection remain in provider folders.
`fetchPackage`, `downloadFile`, `runPnpm` and `runWithLiveLogs` live in the existing
helper package; no additional SDK or toolchain workspaces are introduced. Its
README records the capability ownership audit.

Release provider compilation can query whether a named variable exists and is
non-empty in the initiating run environment through
`getEnvironmentVariableStatus`. It receives only those booleans, so compilers
can choose whether to emit a runtime environment reference without receiving
credential values. The workflow runtime resolves the value from the captured run
environment before any task starts.

Real provider execution tests, including Electron packaging, live in the CLI
host E2E suite. Isolated provider folder tests use mocked service boundaries.

The plugin-core `PipelabContext` type is a provider-facing compatibility alias for
`ProviderHostContext`, not the concrete host class. Its legacy/internal helper API
has intentional breaking changes: bundled asset resolution now requires the
context argument, and `detectRuntime` and its `OutputRuntimes` type are internal
to providers. The helper README and changeset record these boundaries. This
existing helper package retains its `@pipelab/plugin-core` name; it is not an
external extension SDK.

The real Electron packaging test resolves its task factory through
`electronProvider.workflowTasks` from `@pipelab/providers`, using a real core-node
host context. It verifies provider/host integration without invoking a CLI command.
Low-level Forge and executable patch tests remain in the Electron provider folder.

## Provider architecture boundary

`core-node` has one `builtInProviders` list. Release contributions and native
Workflow task registration derive from it; there is no mutable plugin store or
background provider loading. Built-in implementations are versioned together in
`@pipelab/providers`, with isolated provider folders.

Each provider keeps its browser-safe data (identity, icon, integrations and the
catalog fields of its Release sources, producers, destinations and
notifications) in a `metadata.ts` descriptor module. `index.ts` adds the
host-only behavior (`validate`, `compile`, `inspect`, tasks) on top of those
descriptors. The UI builds its pre-connection catalog from the
`@pipelab/providers/metadata` entry, which may import only `@pipelab/shared`;
the UI never imports the providers' root entry. The metadata list defines the
provider order; core-node resolves each host definition against it and fails at
startup if a provider is missing on either side, or if a descriptor's
`inspectable` flag disagrees with its `inspect` implementation. A core-node test
keeps the metadata catalog identical to the one built from the full definitions.
The `@pipelab/plugin-*` IDs and the persisted connection key `pluginName` are
stable provider identifiers used by saved workflows and connections.

Use **provider** for Release/Workflow contributions and **integration** for
credentials and accounts. Reserve **plugin** for a future external extension
system.

External plugin loading, a marketplace, provider manifests, independent provider
versioning, lazy provider installation, sandboxing and trust/security design are
explicitly deferred. The current `ProviderDefinition` is sufficient. After the
final architecture audit, change these boundaries only when a concrete feature
requires it. Product work resumes with configuration UX, onboarding and first
ship, execution reliability and launch readiness.
