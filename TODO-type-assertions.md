# Remaining type assertions

The `any` / `as any` / `as unknown as` / `as never` sweep is done. These are the type
assertions and unchecked helpers that are left. Each one is a place where TypeScript can't prove
a relationship, so removing it needs a redesign or runtime validation, not a local fix.

## Production code

Every item below has been looked at and cannot be removed without trading a visible assertion for
a hidden one (a type predicate that only claims the relationship) or a much larger redesign.

| Where                                             | Assertion                                                                                         | Why it stays                                                                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/migration/src/models/migration.ts` (3×) | `finalState as OutputState`                                                                       | The final state of a migration chain is only known per step. Removing it needs a schema (or guard) per migrator, validated at the end of `migrate`. |
| `packages/workflow-runtime/src/runtime.ts`        | `visit(value) as T`                                                                               | Generic deep redaction returns the same shape it receives; the walk is untyped by design.                                                           |
| `packages/core-node/src/ipc-core.ts`              | `Object.assign(handlers, { [channel]: listener })`                                                | Writing a handler to a per-channel mapped type with a generic key. Reads are fully typed.                                                           |
| `apps/ui/src/composables/websocket-client.ts`     | `Object.assign(this.eventListeners, { [channel]: listeners })`, queued `resolve`/`listener` casts | Same write problem; the queue erases the channel type.                                                                                              |
| `packages/core-node/src/context.ts`               | `// @ts-ignore` on `import.meta`                                                                  | The desktop app typechecks this file as CommonJS, where `import.meta` is an error; `@ts-expect-error` would fail in the ESM build.                  |

## Test code

- `partialDouble<T>()` and `invalidInput<T>()` in `packages/shared/src/test-doubles.ts`, plus a
  copy of `partialDouble` in `workers/shared/test-doubles.ts`. They take `object` / `unknown` and
  return `T`, so they are one documented gap instead of an `as unknown as` at ~130 call sites.
  A mocking library (for example `vitest-mock-extended`) would remove it, but its proxies answer
  every unset property with a function, which changes what tests like `services.x?.y` observe, so
  it needs a per-test review rather than a mechanical swap.

## Not part of this work

- `tauri.ts` writes `name` / `version` as top-level `Cargo.toml` keys instead of under
  `[package]`, so they have no effect. It predates this change and is unchanged.

## Inline object types

The repo-wide pass is done for source files: inline object shapes in annotations, generics and
return types now live as named interfaces in a `<module>.types.ts` next to their user (or in the
package's existing types file). What is left:

- **Shapes that depend on a generic parameter** need a generic interface by hand (for example
  `{ type: "success"; result: T }`, `{ value: RendererData<KEY>; send: ... }`,
  `{ services: TServices }`): `ui/src/pages/workflow-runs-state.ts`,
  `ui/src/composables/handlers.ts`, `ui/src/composables/websocket-client.ts`,
  `ui/src/utils/workflow-execution-input.ts`, `core-node/src/api.ts`, `core-node/src/config.ts`,
  `shared/src/ipc.types.ts`, `shared/src/release/usage.ts`, `shared/src/websocket.types.ts`,
  `test-utils/src/index.ts`, `workflow-runtime/src/runtime.ts`.
- **Files that had unrelated local formatting changes** when the pass ran, so they were skipped:
  `ui/src/App.vue`, `ui/src/components/WebFilePicker.vue`, `ui/src/pages/run-detail.vue`.
- **Identical shapes in different packages** that could be one shared type if the packages agree
  on a meaning: `FsGetRootsEventRoot` (shared) and `RootsItem` (core-node fs handler),
  `ConnectionTestInput` (shared) and `TestConnectionRequest` (core-node), the `{ getThirdPartyPath }`
  context shape in the Construct and Electron providers, and the `ForgeResult`/`TauriResult` and
  `ElectronTargetInputsResult`/`TauriTargetInputsResult` pairs.
- Tests, generated files (`apps/ui/src/generated`, `database.types.ts`), `apps/website` and
  `apps/documentation` were left out on purpose.
- Where a type must be assignable to `Record<string, unknown>` (an interface is not), it stays a
  `type` alias, for example `Exportc3pResult`.
