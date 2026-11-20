# Remaining type assertions

The `any` / `as any` / `as unknown as` / `as never` sweep is done. These are the type
assertions and unchecked helpers that are left. Each one is a place where TypeScript can't prove
a relationship, so removing it needs a redesign or runtime validation, not a local fix.

## Production code

| Where | Assertion | What removing it needs |
| --- | --- | --- |
| `apps/ui/src/composables/api.ts` (5×) | `as End<KEY>`, `as Partial<FilePickerOptions>` | The Electron shell fallback builds a result for a generic channel. Needs per-channel shell handlers or a validated result layer. |
| `packages/migration/src/models/migration.ts` (4×) | `finalState as OutputState`, `{} as OutputState` | The final state of a migration chain can't be proven without a schema per migration step. Make `defaultValue` required to drop the `{}` one. |
| `packages/workflow-runtime/src/runtime.ts` | `visit(value) as T` | Generic deep redaction returns the same shape it receives. |
| `packages/workflow-runtime/src/runtime.ts` | `context.services ?? ({} as TServices)` | Empty default for an unconstrained generic; make `services` required in the context. |
| `packages/core-node/src/ipc-core.ts` | `Object.assign(handlers, { [channel]: listener })` | Writing a handler to a per-channel mapped type with a generic key. Reads are fully typed. |
| `apps/ui/src/composables/websocket-client.ts` | `Object.assign(this.eventListeners, { [channel]: listeners })`, queued `resolve`/`listener` casts | Same write problem; the queue erases the channel type. |
| `packages/providers/src/construct/export-shared.ts` and a few provider files | `as` after valibot/JSON parsing of provider-specific shapes | Add a schema for the few remaining shapes. |

## Test code

- `partialDouble<T>()` and `invalidInput<T>()` in `packages/shared/src/test-doubles.ts`, plus a
  copy of `partialDouble` in `workers/shared/test-doubles.ts`. They take `object` / `unknown` and
  return `T`, so they are one documented gap instead of an `as unknown as` at ~130 call sites.
  To remove them, replace the doubles with full typed fakes or a mocking library
  (for example `vitest-mock-extended`).
- `fakeResponse` in `packages/core-node/src/utils/github.test.ts` (`Partial<Response> as Response`).

## Not part of this work

- `tauri.ts` writes `name` / `version` as top-level `Cargo.toml` keys instead of under
  `[package]`, so they have no effect. It predates this change and is unchanged.

## Inline object types (repo-wide pass)

The cast-removal PR named the inline object types it added (bridge results, storage info, auth
results, WebSocket messages, cloud overview, worker rows, config documents). The rest of the
repo still has inline object shapes in annotations, generics and return types, for example
`Promise<{ path: string; size: number }>`, `Array<{ ... }>` and `: { a: string; b: number }`
parameters. Convert them to named `interface`s (object shapes) or `type`s (unions,
intersections, mapped types), per `AGENTS.md`, and define each shape once.

- Find them with a search for `: {`, `<{`, `Array<{` and `Promise<{` in non-test source,
  and check the result by hand: object literals and valibot schemas are values, not types.
- Start with `packages/providers/src` (provider inputs, `godot/export.ts`), `packages/core-node`
  handlers and `apps/ui/src` components.
