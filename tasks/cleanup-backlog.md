# Cleanup backlog

Leftovers from the legacy / dead-code audit. Tick items off as they land.
SQL migrations in `supabase/migrations` are out of scope on purpose.

**Done in batch 1:** stable/beta import removed, JS config migrations reset to
a single `1.0.0` state (settings, projects, connections), migration lib fixes,
deprecated aliases, backward-compat shims, `SUPABASE_ANON_KEY` fallbacks, dead
exports, `knip` added. Local dev data (`~/.config/@pipelab/app-dev|app-beta`)
migrated; backup in the session scratchpad.

**Effort:** 🟢 trivial delete · 🟡 needs a quick check · 🔴 needs a decision

---

## 1. Tooling

- [x] Wire `pnpm knip` into CI (lint job in `release.yml`)
- [x] Turn on the remaining knip checks (files, dependencies, unlisted, binaries)
- [x] Knip entries for supabase functions/tests, core-node scripts, desktop builder config

## 2. Unused files

- [x] Removed in batch 2: unused `apps/ui`, `apps/website` and package files reported by knip

## 3. Dependencies

- [x] Unused dependencies and devDependencies removed (ui, cli, website, core-node, providers, shared, plugin-core, root)
- [x] Undeclared imports now declared (`change-case`, `semver`, `confbox`, `serve-handler`, `@supabase/supabase-js`, `@electron-toolkit/preload`, `ws`, `electron` types, `esbuild`, `playwright`)
- [ ] 🟡 `@pipelab/asset-electron` / `asset-tauri` in core-node are knip-ignored; confirm whether they are needed at bundle time
- [ ] 🟢 Add the Vue `tslib` / `@pipelab/tsconfig` knip ignores to the owning packages instead of globally

## 4. Backward-compat code still in the tree

- [ ] 🟡 `build-history.ts` `parseArtifact` legacy artifact shape (name + type, no descriptor). **Still written:** `WorkflowResult.artifacts` in `packages/workflow-runtime/src/types.ts` is `WorkflowArtifact | WorkflowArtifactInstance`, and `historyArtifacts` (core-node `handlers/workflow.ts`) and `run-detail-state.ts` (ui) map the descriptor-less variant. Remove the `WorkflowArtifact` variant from the runtime first, then narrow `BuildHistoryEntry.artifacts` and the parser.
- [x] PostHog legacy identity reset removed (`clearLegacyPostHogIdentity`, `loaded` hook); the normal reset on sign-out stays
- [x] Decided: keep the `isElectron` global in the exported-game preload
- [ ] 🔴 `supabase/functions/_shared/billing.ts` (+ test): falls back to `SUPABASE_ANON_KEY`. Wanted: `SUPABASE_PUBLISHABLE_KEY` only. **Blocked:** Supabase injects only `SUPABASE_ANON_KEY` into edge functions and the CLI rejects custom secrets whose name starts with `SUPABASE_`, so the new name cannot be set as a function secret. Needs a different approach (read `SUPABASE_ANON_KEY` only, or a non-prefixed secret name).
- [x] Decided: keep persisted `pluginName` and `@pipelab/plugin-*` IDs (public provider IDs, not a shim)
- [ ] 🟡 `packages/shared/src/config/migrators.ts`: `Migrator<T>` interface uses `any`;
      each document still carries a one-step migrator.
- [x] Old graph-pipeline JSON fixtures removed (provider e2e fixtures, desktop `start:args` script pointing at a missing file)
- [x] Construct spec mocks match the real export output (`zipFile` only)

## 5. Stale docs and planning files

- [x] `TODO_MONOREPO.md` removed
- [x] `tasks/todo.md` removed
- [x] `docs/auth.drawio`, `docs/auth.png` removed
- [ ] 🟡 `apps/documentation/contributing/repository-migration.md`: still linked for required secrets/setup in `releases.md`; fold that content into `releases.md`, then delete.
- [x] `ARCHITECTURE.md` no longer describes the removed legacy evaluator
- [ ] 🟡 `packages/migration/README.md` and `apps/ui/README.md` mention of migration handling:
      re-read after batch 1.

## 6. Scripts, tests and apps

- [x] `scripts/delete_tags.sh`, `scripts/upload-windows.sh` removed
- [x] `save-data-folder` test moved into `assets/asset-electron` with a `test` script
- [x] Decided: keep `apps/mini-c3-electron`
- [x] Commented-out code removed (`Settings.vue`, `export-shared.ts`)
