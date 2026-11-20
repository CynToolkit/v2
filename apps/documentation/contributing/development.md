# Develop Pipelab

Pipelab is a pnpm workspace with apps, shared packages, providers, and Workers. Use the versions pinned in [`mise.toml`](https://github.com/CynToolkit/v2/blob/main/mise.toml): Node.js 24 and pnpm 10.33.0.

## Get the workspace running

```sh
pnpm install
pnpm dev
```

The root `dev` script starts the workspace development setup. The desktop app starts its own CLI server on a per-launch loopback port and verifies it before loading the UI; for the desktop path, do not start a second CLI server. Vite HMR remains active for UI work. Restart Desktop after changing CLI server source. To work on the standalone UI and remote CLI backend, use `pnpm dev-remote`.

The desktop development scripts use Doppler (`doppler run -- pnpm dev`). If using the plain root script, create a root `.env` as needed:

```dotenv
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
PIPELAB_CLOUD_WORKER_URL=...
POSTHOG_API_KEY=...
```

These values enable Supabase-backed authentication, Pipelab Cloud artifact requests, and PostHog telemetry respectively. `SUPABASE_PUBLISHABLE_KEY` is the browser/client key. They are optional for local development; missing cloud configuration disables the associated cloud functionality, and the CLI warns that authentication is disabled when Supabase is unavailable. Never commit real credentials. `mise run supabase:setup` starts a local Supabase stack; see `supabase/README.md`.

To run the standalone UI and CLI backend, use:

```sh
mise run dev
```

Cloud configuration is optional: unless the variables above are set in your environment or root `.env`, authentication, billing, telemetry, and cloud artifact requests are unavailable. Maintainers with Doppler access can use `mise run dev:cloud` (UI and CLI) or `mise run desktop` (desktop app) to run with the real cloud configuration.

Billing is available in every Editor build. To validate billing locally, use
the mocked function tests in `supabase/README.md` and the browser journeys in
`apps/ui/tests/browser/README.md`. The browser checks use synthetic responses;
they need no Polar account, credentials, or external Polar calls. They do not
exercise a live provider or customer portal.

To run the UI as a hosted browser shell without starting an agent connection,
set `VITE_PIPELAB_MODE=hosted` for the UI build. This only skips agent
discovery at startup; later pairing can attach an agent in the same session.
Browser account identity always comes from the browser's Supabase session and
does not change when an agent connects or disconnects. Browser account features
need `SUPABASE_URL` and the public `SUPABASE_PUBLISHABLE_KEY`. For email verification
and password recovery, add the exact HTTPS deployment origin and its
`/auth/callback` route to Supabase Auth's allowed redirect URLs and configure
the host's SPA fallback. Desktop builds keep the `pipelab://` verification
flow; do not expose service-role or billing secrets in UI environment values.

### Local browser auth acceptance

The checked-in local Supabase config enables email confirmation, sets the Auth
site URL to `http://127.0.0.1:5185`, and allows the exact Editor callback
`http://127.0.0.1:5185/auth/callback`. Local SMTP is captured by Mailpit at
`http://127.0.0.1:54324`; it does not send real email. Start the local stack
with `supabase start`, then run the hosted Editor on port `5185` with only the
local API URL and public anon key. Use the full confirmation and recovery
journey documented in the repository file `apps/ui/tests/browser/README.md`.
Do not print or evaluate all of `supabase status` output: it also includes
local service credentials. Never use production values for this journey.

## Focus a package

To run any CLI command from a source checkout in development mode (development user-data directory), use the root `pipelab` script. It bundles the workspace sources the first time and whenever a source file changes, then starts in about a second:

```sh
pnpm pipelab workflow list
pnpm pipelab workflow run <id-or-name> --dry-run
```

Use the workspace name and package scripts to keep iteration focused:

```sh
pnpm --filter @pipelab/cli dev
pnpm --filter @pipelab/cli test
pnpm --filter @pipelab/cli typecheck
pnpm --filter @pipelab/ui test
pnpm --filter @pipelab/ui typecheck
```

Root `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` delegate to Turbo. Turbo task ordering and outputs are defined in `turbo.json`; use workspace scripts rather than inventing a build order. CLI end-to-end, workflow, and provider tests run in the CLI host under `apps/cli/tests/e2e`. UI behavior belongs in UI tests. The Electron startup smoke is manual-only and is not a feature-test harness: it is a single Playwright test (`apps/desktop/tests/e2e/smoke.e2e.ts`) that launches the packaged app with a throwaway profile and checks that the renderer loads from the bundled CLI server and the preload bridge is exposed. Run `pnpm --filter @pipelab/app smoke:electron:manual` to build the CLI, package the app and run it, or `smoke:electron:run` to reuse an existing package (on headless Linux wrap either in `xvfb-run -a`).

### Cross-platform local release CI

The single **CI & Release** workflow (`release.yml`) runs on pushes to `main`
and `develop`, and PRs targeting those branches. Feature branch pushes alone
do not duplicate their PR run. Its **CI passed** gate blocks deployments and
main's Changesets publication until required checks succeed.

Linux's full test suite covers credential-free local release, run-history,
artifact IPC, and Construct profile validation. Focused platform jobs run the
same release coverage on Windows and macOS without duplicating Linux tests.
Regular CI does not launch Electron; the minimal startup
smoke remains manual-only. Authenticated Construct-to-Electron acceptance is
an explicit workflow dispatch with `Run authenticated local Ship` enabled.
The dispatch runs after the complete CI gate passes; pushes
and pull requests do not access Construct secrets. It requires the
`CONSTRUCT_CI_USERNAME` and `CONSTRUCT_CI_PASSWORD` GitHub Actions secrets for
a dedicated test account. CI creates a temporary Chromium profile through
Construct's account and editor flow. It drives the Desktop Ship wizard with
the checked-in sample `.c3p`, verifies the real Construct export and generated
Electron app, then ships again across Desktop cold starts and checks reopened
run history and artifacts. The profile is removed with the hosted runner.
Never copy a developer's browser profile into CI. The dispatch fails clearly
if either secret is missing, so the live acceptance cannot silently pass
without running. Regular push and pull request tests remain credential-free.

To seed the dedicated Construct profile locally, run `mise run setup-providers`
(or `mise run setup:construct` alone). It installs Playwright's Chromium if needed, signs in with `CONSTRUCT_USERNAME` and `CONSTRUCT_PASSWORD`
(from the environment, otherwise from Doppler project `pipelab`, config
`dev_personal`; override with `DOPPLER_PROJECT` and `DOPPLER_CONFIG`), and
prints `CONSTRUCT_PROFILE_PATH`, the `.../PipelabConstruct/Default` profile to
select on the workflow's Construct source. It signs in again on every run. `mise run setup:poki`
saves a Poki login without a browser on the machine: it prints Poki's sign-in
link, you open it on any device, then give it the final `http://localhost:8745/…`
URL from the address bar (set `POKI_LOGIN_URL`, pass it as an argument, or paste
it at the prompt). An existing Poki CLI login is kept; delete `poki/auth.json` in your config
directory (`$XDG_CONFIG_HOME` or `~/.config`) to sign in again. Set `POKI_ACCOUNT=studio` to save the login for a
named Poki Account Connection in Pipelab's managed directory instead. Further provider setup tasks
are added under `setup-providers`.

For a local authenticated run, use a dedicated Playwright Chromium user-data
directory with the fixed basename `PipelabConstruct`; keep it separate from
your everyday browser profile. Load `CONSTRUCT_CI_USERNAME` and
`CONSTRUCT_CI_PASSWORD` from a local secret manager, then seed the profile
through the repository helper. In a POSIX shell from the repository root:

```sh
export CONSTRUCT_CI_PROFILE_USER_DATA="${XDG_CONFIG_HOME:-$HOME/.config}/chromium/PipelabConstruct"
pnpm --filter @pipelab/providers exec playwright install chromium
profile_env="$(mktemp)"
trap 'rm -f "$profile_env"' EXIT
GITHUB_ENV="$profile_env" node packages/providers/scripts/prepare-construct-ci-profile.mjs
export CONSTRUCT_CI_PROFILE_PATH="$(sed -n 's/^CONSTRUCT_CI_PROFILE_PATH=//p' "$profile_env")"
test -n "$CONSTRUCT_CI_PROFILE_PATH"

pnpm --filter @pipelab/cli exec vitest run \
  -c tests/e2e/vitest.config.mts \
  tests/e2e/tests/construct-ui-to-binary.spec.ts
```

The helper launches Playwright's Chromium with `PipelabConstruct` as its user
data directory. It gets a Construct login session, stores the session through
Construct's account page, opens the editor, and confirms the session with
Construct's token endpoint. It writes the resulting
`.../PipelabConstruct/Default` path to the temporary environment file for the
test. The dedicated profile remains in the Chromium config directory for later
runs; the temporary environment file is removed when the shell exits. Never
point this test at a personal Chromium profile or edit its IndexedDB directly.

The UI dev server also allows assets from the resolved workspace `node_modules`
directory. When a Git worktree shares dependencies through a symlink, icon fonts
remain available through the normal UI dev command.

## Keep CLI and UI behavior aligned

The CLI and UI should call the same engine use cases for shared capabilities.
Keep policy, validation, execution, and capability gates in that shared layer;
host code should pass its transport-specific inputs. When adding workflow IPC
inputs or feature gates, update
`apps/cli/tests/e2e/parity-contracts/workflow-execution.ts`; the CLI typecheck
script checks that exhaustive contract. Add a behavioral test that runs both
host paths against the shared engine. Document deliberate differences in that
contract, such as environment source, connection identity, and CLI-only
terminal options.

## Package the desktop app

```sh
pnpm package
pnpm make
```

`package` creates a runnable, unpacked bundle; `make` creates the configured installer/archive for the current host. Both stage the bundled CLI and UI; output is under `apps/desktop/out/`. Release CI separately builds Linux x64, Windows x64, macOS x64, and macOS arm64. This matrix does not establish that local packaging works identically on every host or define minimum end-user OS versions. See [Release Pipelab](/contributing/releases) for publication workflows.

## Documentation

Product documentation lives in `apps/documentation`. When a code change affects documented behavior, update the relevant page in the same change. Use `pnpm docs` to develop the site and `pnpm docs:build` to build it. Follow the repository's `AGENTS.md` for evidence, links, and scope-specific verification expectations.
