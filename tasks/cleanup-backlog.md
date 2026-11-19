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
- [x] `@pipelab/asset-electron` / `asset-tauri` dropped from core-node (assets are resolved by path under the CLI `assets/` dir, not via node_modules)
- [x] `tslib` declared in `packages/tsconfig`; `@pipelab/tsconfig` stays in the global knip ignore (consumed through `extends`, which knip cannot see)

## 4. Backward-compat code still in the tree

- [x] Legacy artifact shape removed: `WorkflowArtifact` dropped from workflow-runtime; history stores the runtime artifact instance; parser and UI no longer branch on the old shape
- [x] PostHog legacy identity reset removed (`clearLegacyPostHogIdentity`, `loaded` hook); the normal reset on sign-out stays
- [x] Decided: keep the `isElectron` global in the exported-game preload
- [x] Edge function reads `SUPABASE_PUBLISHABLE_KEYS` (JSON dictionary, `default` key) injected by Supabase; `SUPABASE_ANON_KEY` fallback removed
- [x] Decided: keep persisted `pluginName` and `@pipelab/plugin-*` IDs (public provider IDs, not a shim)
- [x] `Migrator<T>` interface typed (no `any`), unused `configRegistry` removed
- [x] Old graph-pipeline JSON fixtures removed (provider e2e fixtures, desktop `start:args` script pointing at a missing file)
- [x] Construct spec mocks match the real export output (`zipFile` only)

## 5. Stale docs and planning files

- [x] `TODO_MONOREPO.md` removed
- [x] `tasks/todo.md` removed
- [x] `docs/auth.drawio`, `docs/auth.png` removed
- [x] `repository-migration.md` became `ci-and-deployment.md` (import history and deferred-PR notes dropped)
- [x] `ARCHITECTURE.md` no longer describes the removed legacy evaluator
- [x] READMEs re-read: migration README rewritten in batch 1; `apps/ui/README.md` mentions are about auth sessions and still accurate

## 6. Scripts, tests and apps

- [x] `scripts/delete_tags.sh`, `scripts/upload-windows.sh` removed
- [x] `save-data-folder` test moved into `assets/asset-electron` with a `test` script
- [x] Decided: keep `apps/mini-c3-electron`
- [x] Commented-out code removed (`Settings.vue`, `export-shared.ts`)

---

# Audit pass 2

## Done

- [x] Empty `HelloWorld.spec.ts` placeholder test removed
- [x] Commented-out code removed (`Settings.vue` versions tab, `tauri.ts`, `App.vue`, docs theme)
- [x] `asset-netlify` and `asset-discord` removed (no provider references them), plus root `netlify.toml` and `.netlify` ignore; docs deploy to Cloudflare Pages
- [x] `scripts/network-interceptor.mjs` (unreferenced) and `.vscode/launch.json` (points at a missing electron-forge script) removed
- [x] `mise docs-generate-mermaid` no longer targets three missing `.mermaid` files

## Open (needs a decision)

- [ ] 🔴 `.devcontainer/devcontainer.json` pins Node 22.4 and a universal image; repo is on Node 24. Update or delete?
- [ ] 🟡 `mise.toml` local tasks chain env fallbacks (`PUBLISHABLE_KEY` -> `SUPABASE_PUBLISHABLE_KEY`, `SERVICE_ROLE_KEY` -> `SECRET_KEY` -> ...). Simplify once the supabase CLI output is checked.
- [ ] 🟢 47 `console.log/debug` calls in UI and package sources (e.g. `App.vue` `log:message` handler)
- [ ] 🟢 Open `TODO` comments: `desktop/src/preload.ts`, `providers/electron/forge.ts`, `providers/tauri/tauri.ts`, `asset-electron` steam handlers
- [ ] 🟡 `docs/expression.md` is a stub at the repo root and not linked from anywhere
