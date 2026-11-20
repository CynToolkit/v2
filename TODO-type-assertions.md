# Remaining type assertions

The `any` / `as any` / `as unknown as` / `as never` sweep is done. These are the type
assertions and unchecked helpers that are left. Each one is a place where TypeScript can't prove
a relationship, so removing it needs a redesign or runtime validation, not a local fix.

## Production code

Every item below has been looked at and cannot be removed without trading a visible assertion for
a hidden one or a much larger redesign.

| Where                                             | Assertion                        | Why it stays                                                                                                                                                             |
| ------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/migration/src/models/migration.ts` (3×) | `finalState as OutputState`      | The final state of a migration chain is only known per step. Removing it needs a schema (or guard) per migrator, validated at the end of `migrate`. Deferred on purpose. |
| `packages/workflow-runtime/src/runtime.ts`        | `visit(value) as T`              | Generic deep redaction returns the same shape it receives; the walk is untyped by design.                                                                                |
| `packages/core-node/src/context.ts`               | `// @ts-ignore` on `import.meta` | The desktop app typechecks this file as CommonJS, where `import.meta` is an error; `@ts-expect-error` would fail in the ESM build.                                       |

The handler registries (`ipc-core.ts`, `websocket-client.ts`) hold one entry per registration and
rely on method-signature bivariance (`WebSocketHandlerEntry`, `EventSubscription`) instead of
generic-key writes. That is the one soft spot there; it is documented on the types.

## Test code

- `partialDouble<T>()` and `invalidInput<T>()` in `packages/shared/src/test-doubles.ts`, plus a
  copy of `partialDouble` in `workers/shared/test-doubles.ts`. They take `object` / `unknown` and
  return `T`, so they are one documented gap instead of an `as unknown as` at ~130 call sites.
  A mocking library (for example `vitest-mock-extended`) would remove it, but its proxies answer
  every unset property with a function, which changes what tests like `services.x?.y` observe, so
  it needs a per-test review rather than a mechanical swap. Kept on purpose.

## Not part of this work

- `tauri.ts` writes `name` / `version` as top-level `Cargo.toml` keys instead of under
  `[package]`, so they have no effect. Tauri is not supported, so it is left as is.

## Inline object types

Done for source files: inline object shapes live as named interfaces in a `<module>.types.ts`
next to their user (or in the package's existing types file), identical shapes share one
definition, and shapes that depend on a generic parameter are generic interfaces.

- Tests, generated files (`apps/ui/src/generated`, `database.types.ts`), `apps/website` and
  `apps/documentation` were left out on purpose.
- Where a type must be assignable to `Record<string, unknown>` (an interface is not), it stays a
  `type` alias, for example `Exportc3pResult`.
- Single-field shapes that only match by coincidence (`{ projectId: string }`) were not merged.
