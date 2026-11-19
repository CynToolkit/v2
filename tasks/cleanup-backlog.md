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

- [ ] 🔴 `packages/shared/src/build-history.ts` `parseArtifact`: "legacy artifact" shape
      (name + type, no descriptor). Check whether anything still writes it.
- [ ] 🔴 PostHog identity reset: `apps/ui/src/store/auth.ts` (`clearLegacyPostHogIdentity`)
      and `apps/ui/src/plugins/posthog.ts` (`loaded` hook). It is a privacy guard and tests
      count `posthog.reset` calls.
- [ ] 🔴 `assets/asset-electron/template/src/preload.js`: deprecated `isElectron` global.
      Exported games might read it.
- [ ] 🔴 `supabase/functions/_shared/billing.ts` (+ test): falls back to `SUPABASE_ANON_KEY`.
      Supabase injects that variable into edge functions, so verify before removing.
- [ ] 🔴 Persisted connection key `pluginName` and `@pipelab/plugin-*` IDs, documented as
      "compatibility identifiers" in `apps/documentation/contributing/architecture.md`.
- [ ] 🟡 `packages/shared/src/config/migrators.ts`: `Migrator<T>` interface uses `any`;
      each document still carries a one-step migrator.
- [ ] 🟡 Old graph-pipeline JSON fixtures: `packages/providers/src/**/tests/e2e/fixtures/*.json`
      (have `canvas`, version `3.0.0`). Check whether any test still loads them.
- [ ] 🟡 `packages/providers/src/construct/tests/e2e/construct.spec.ts` still passes `parentFolder`
      to a mock; confirm it is not the removed export output.

## 5. Stale docs and planning files

- [x] `TODO_MONOREPO.md` removed
- [x] `tasks/todo.md` removed
- [x] `docs/auth.drawio`, `docs/auth.png` removed
- [ ] 🟡 `apps/documentation/contributing/repository-migration.md`: finished one-off runbook.
      Linked from `.vitepress/config.mts` and `contributing/releases.md` (lines ~45, ~152).
- [ ] 🟡 `ARCHITECTURE.md` mentions a "legacy evaluator": confirm it still exists.
- [ ] 🟡 `packages/migration/README.md` and `apps/ui/README.md` mention of migration handling:
      re-read after batch 1.

## 6. Scripts, tests and apps

- [x] `scripts/delete_tags.sh`, `scripts/upload-windows.sh` removed
- [ ] 🟡 `tests/save-data-folder.test.mjs` is not wired to any test script. Wire it or move it
      next to `assets/asset-electron/template/src/handlers/user/save-data-folder.js`.
- [ ] 🔴 `apps/mini-c3-electron`: no consumers found but it is in `.changeset/pre.json`.
      Is it still shipped?
- [x] Commented-out code removed (`Settings.vue`, `export-shared.ts`)
