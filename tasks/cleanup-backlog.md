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

- [ ] 🟢 Wire `pnpm knip` into CI (`turbo.json` task or a GitHub workflow)
- [ ] 🟡 Turn on the remaining knip checks once the groups below are clean.
      Remove `"include"` from `knip.json`, or preview with:
      `pnpm knip --include files,dependencies,devDependencies,unlisted,binaries`
- [ ] 🟡 Add knip entries for false positives: `supabase/functions/*/index.ts`,
      `supabase/tests/*.mjs`, `packages/core-node/scripts/*.ts`

## 2. Unused files (knip)

### `apps/ui` 🟡
- [ ] `src/agent/log.ts`, `src/agent/trpc.ts`, `src/agent/utils/json.ts`
- [ ] `src/components/ArtifactsQuickView.vue`
- [ ] `src/components/BuildStatusBadge.vue`
- [ ] `src/components/ColorPicker.vue`
- [ ] `src/components/DisconnectedPage.vue`
- [ ] `src/components/FileInput.vue`
- [ ] `src/components/SubscriptionLoadingIndicator.vue`
- [ ] `src/composables/middleware.ts`, `usePostHog.ts`, `useTour.ts`
- [ ] `src/models/constants.ts`, `src/models/error.ts`
- [ ] `src/store/user.ts`, `src/style/main.ts`, `src/utils/code-editor.ts`

### `apps/website` 🟢 (Vue starter leftovers)
- [ ] `src/components/icons/Icon{Community,Documentation,Ecosystem,Support,Tooling}.vue`
- [ ] `src/components/TheWelcome.vue`, `WelcomeItem.vue`
- [ ] `src/stores/counter.ts`
- [ ] `src/views/docs/[...slug].vue`

### Packages and desktop 🟡
- [ ] `packages/core-node/src/handlers.ts`
- [ ] `packages/providers/src/steam/utils.ts`
- [ ] `packages/providers/.construct-benchmark.ts`
- [ ] `packages/workflow-runtime/src/phase-types.typecheck.ts` (may be a type-test: check before deleting)
- [ ] `apps/desktop/electron-builder.config.mjs`
- [ ] `apps/desktop/scripts/headless-electron-tester.mts`, `test-github-releases.mts`

## 3. Dependencies

### Unused dependencies (`package.json`) 🟡
- [ ] `apps/ui` (≈25): `@codemirror/lang-liquid`, `@codemirror/lint`, `@floating-ui/vue`,
      `@jitl/quickjs-wasmfile-release-sync`, `@trpc/client`, `@vuelidate/core`,
      `@vuelidate/validators`, `@vueuse/components`, `@vueuse/router`, `change-case`,
      `dompurify`, `es-toolkit`, `fancy-ansi`, `get-value`, `path-browserify`, `polished`,
      `semver`, `set-value`, `slash`, `string-strip-html`, `thememirror`, `tinykeys`,
      `ts-pattern`, `tslog`, `type-fest`
- [ ] `apps/cli`: `execa`, `nanoid`, `serve-handler`
- [ ] `apps/website`: `@pipelab/shared`, `@vueuse/core`, `@vueuse/router`
- [ ] `packages/core-node`: `@pipelab/asset-electron`, `@pipelab/asset-tauri`
      (check: may be needed at build/bundle time), `adm-zip`, `es-toolkit`, `execa`, `type-fest`
- [ ] `packages/providers`: `electron`, `es-toolkit`
- [ ] `packages/shared`: `klona`
- [ ] `plugins/plugin-core`: `electron`, `type-fest`

### Unused devDependencies 🟡
- [ ] Root: `@pipelab/constants`, `@pipelab/core-node`, `@pipelab/shared`, `@pipelab/tsconfig`,
      `@types/tar`, `cross-env`, `execa`, `nanoid`, `vitest`
- [ ] `@pipelab/tsconfig` in every package (probably referenced via `extends`, which knip
      may not see: likely a false positive, add config)
- [ ] `apps/ui`: `@types/semver`; `apps/desktop`: `electron-builder`
- [ ] `packages/core-node`: `@types/adm-zip`, `@types/tar`; `packages/providers`: `msw`;
      `packages/shared`: `esbuild-plugin-wasm`; `plugins/plugin-core`: `@pipelab/constants`, `@types/tar`

### Missing / undeclared 🟡
- [ ] Unlisted dependencies: `playwright` (cli e2e, `scripts/setup`), `@electron-toolkit/preload` (ui),
      `@supabase/supabase-js` (ui), `serve-handler` (core-node), `change-case`, `semver`,
      `confbox` (providers), `electron` and `ws` (shared), `esbuild` (`scripts/pipelab-dev.mjs`),
      `tslib` (`packages/tsconfig/vue.json`)
- [ ] Unlisted binaries: `tsx`, `supabase`, `doppler` (declare or ignore in knip)

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

- [ ] 🟢 `TODO_MONOREPO.md` (stale roadmap, stray note at the top)
- [ ] 🟢 `tasks/todo.md` (unchecked "Generic Release Architecture" list)
- [ ] 🟢 `docs/auth.drawio`, `docs/auth.png` (unreferenced)
- [ ] 🟡 `apps/documentation/contributing/repository-migration.md`: finished one-off runbook.
      Linked from `.vitepress/config.mts` and `contributing/releases.md` (lines ~45, ~152).
- [ ] 🟡 `ARCHITECTURE.md` mentions a "legacy evaluator": confirm it still exists.
- [ ] 🟡 `packages/migration/README.md` and `apps/ui/README.md` mention of migration handling:
      re-read after batch 1.

## 6. Scripts, tests and apps

- [ ] 🟢 `scripts/delete_tags.sh`, `scripts/upload-windows.sh` (no references)
- [ ] 🟡 `tests/save-data-folder.test.mjs` is not wired to any test script. Wire it or move it
      next to `assets/asset-electron/template/src/handlers/user/save-data-folder.js`.
- [ ] 🔴 `apps/mini-c3-electron`: no consumers found but it is in `.changeset/pre.json`.
      Is it still shipped?
- [ ] 🟢 Commented-out code: `apps/ui/src/components/Settings.vue` (`// const isElectron`),
      `packages/providers/src/construct/export-shared.ts` (`// addonsFolder`)
