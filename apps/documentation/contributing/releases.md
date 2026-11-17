# Release Pipelab

This runbook covers releases of the Pipelab application and CLI themselves. It is separate from user-authored **Release workflows**, which build or deliver a user's game. A game workflow does not create a Pipelab GitHub Release or publish the CLI to npm.

## Shared release flow

The repository follows the [Changesets Action publishing guide](https://github.com/changesets/action/tree/v1#with-publishing).
Desktop (`@pipelab/app`), CLI (`@pipelab/cli`), and UI (`@pipelab/ui`) belong to
one Changesets fixed group and release with the same version.

1. Run `pnpm changeset`, describe the change, and commit it with your code.
2. Merge to `main`. After CI passes, `.github/workflows/release.yml` runs `changesets/action@v1`
   to open or update a **Version Packages** pull request. `pnpm version-packages`
   updates versions, changelogs, and the pnpm lockfile.
3. On the generated PR, select **Approve workflows to run** if GitHub requires
   it, then review the version changes and CI results before merging.
4. After that PR merges, the action runs `pnpm release`: build the bundled CLI,
   inspect its npm package with `npm pack --dry-run`, and run `changeset publish`.
5. When the action reports `published: true`, the same workflow builds the
   desktop installers and publishes one GitHub release named `v<version>`
   (for example, `v2.0.0-beta.40`), tagged `@pipelab/app@<version>` at that commit.

The CLI is the only npm-public workspace. Its `publishConfig.directory` points
to `apps/cli/dist`, which contains the standalone bundle, executable manifest,
UI, and assets. Internal libraries and templates remain private to the
workspace; they are bundled with the CLI rather than published separately.
Changesets still versions private packages when dependencies change.

The repository is in Changesets `beta` prerelease mode. The included baseline
Changeset makes the first version PR align the previously different desktop
and CLI versions. Keep generated version changes in that PR rather than
editing versions manually. To prepare a stable release, run
`pnpm changeset pre exit`, commit the resulting state, and review the next
version PR.

Enable **Settings → Actions → General → Allow GitHub Actions to create and
approve pull requests**. The workflow requests contents and pull-request write
permissions for the action. Configure npm Trusted Publishing for `@pipelab/cli`
before merging the version PR (see below). No npm token, personal GitHub token, or
separate tag dispatch is needed: desktop jobs follow the action's output
within the same workflow. Pushing a tag alone does not start a release.

All builds use Node 24.15.0 and frozen pnpm installs. Review the release target,
signing credentials, and old-client update bridge before merging a version PR.
See the [repository migration runbook](/contributing/repository-migration) for
required secrets and repository setup.

The **CI & Release** workflow is the single entry point for PRs targeting
`main` or `develop`, pushes to those branches, and manual acceptance checks.
Lint, typecheck, Linux tests/builds and Windows/macOS release checks run before
the **CI passed** gate. Configure branch protection to require **CI passed**;
the gate fails if any required job fails, is cancelled, or is skipped.
Production deployments and Changesets publication also depend on this gate
for the exact commit being processed. The npm trusted workflow remains `release.yml`.

Editor, website and documentation deployments run independently after CI
passes. Every successful push deploys all three apps: production on `main`,
previews on `develop`. This catches up changes from earlier failed or
cancelled runs. Same-repository PR previews deploy only changed apps. Fork PRs
run validation without deployment credentials. The deployment
YAML files are reusable workflows called by this entry point, not independent
push triggers. Website and documentation deployments download the verified build artifacts
from the same run. Editor deployment builds with its channel's configuration,
which can differ from the desktop UI used in validation.
Outdated PR/develop runs are cancelled. An in-progress main push run is not
cancelled; a newer push can replace a queued main run. Manual acceptance runs
have a separate concurrency group and do not replace push runs.
Manual dispatch runs checks and optional authenticated acceptance only; it does
not deploy or publish. To retry deployment, re-run failed jobs on its original run.

## Desktop GitHub release

The desktop workflow builds these matrix entries:

- Linux x64
- Windows x64
- macOS x64
- macOS arm64

Forge is configured for Windows Squirrel outputs, Linux ZIP, and macOS DMG on release builds. The workflow uploads files produced by Forge, verifies macOS executable architecture and code signature, then publishes or updates the same-tag GitHub Release. The release body is the version's changelog section from `apps/cli/CHANGELOG.md` (extracted by `scripts/release-notes.mjs`), generated by `@changesets/changelog-github` so entries link to their pull requests and authors. Tags containing `-` mark the GitHub Release as a prerelease. The release asset glob also accepts `.deb` and `.rpm`, but those patterns do not mean Forge currently creates those formats.

The workflow uses the following secrets from the v2 repository's configured
Actions secrets. Production Supabase client values are passed into release
builds; never put secret values in this documentation:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` (falls back to the legacy `SUPABASE_ANON_KEY` while migrating)
- `SUPABASE_PROJECT_ID`
- `POSTHOG_API_KEY`
- `CERTIFICATE_OSX_APPLICATION`
- `CERTIFICATE_OSX_APPLICATION_PASSWORD`
- `APPLE_ID`
- `APPLE_ID_PASSWORD`
- `APPLE_TEAM_ID`

macOS prereleases may be built without Apple credentials. If none of the five
Apple secrets are configured, Forge ad-hoc signs the app before packaging; the
workflow still checks architecture and signature integrity, but the build is
not Developer ID signed or notarized. macOS may block the app on first launch;
users can approve that app through Apple's per-app [Open Anyway](https://support.apple.com/en-us/102445)
flow. Do not disable Gatekeeper
globally. If only some Apple secrets are set, the release job fails and names
the missing secrets. Stable macOS releases require all five secrets and use
Developer ID signing and notarization. CI imports the certificate and checks
the Developer ID identity before upload when credentials are present. GitHub's
workflow token is used for release publication.

## CLI npm release

The release action publishes `@pipelab/cli` from its staged `dist` directory
with public access using [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/).
In the npm package's **Settings → Trusted publishing**, add a **GitHub Actions**
publisher with these values:

| Field | Value |
| --- | --- |
| Organization or user | `CynToolkit` |
| Repository | `v2` |
| Workflow filename | `release.yml` |
| Environment name | Leave blank |
| Allowed actions | Allow direct publishing with `npm publish` |

The release job grants `id-token: write` on a GitHub-hosted runner. Node
24.15.0 includes an npm version supporting OIDC (npm 11.5.1 or newer is
required). pnpm delegates publishing to npm, which authenticates automatically;
do not add `NPM_TOKEN` or `NODE_AUTH_TOKEN`. The staged manifest preserves the
repository metadata required by npm. A new trust configuration must complete
its first successful publish within two days; recreate it if it expires.

The workflow passes
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (falling back to
`SUPABASE_ANON_KEY`), `SUPABASE_PROJECT_ID`, and `POSTHOG_API_KEY` into the
bundle build. Desktop packaging starts after successful CLI publication.

For the Supabase key-name rollout, add `SUPABASE_PUBLISHABLE_KEY` to Doppler and GitHub Actions secrets first. Production builds on `main` prefer it and temporarily fall back to `SUPABASE_ANON_KEY`; `develop` and PR preview builds omit production Supabase values. Verify Editor, Website, Desktop, and CLI authentication before removing the old secret in a separate approved change. Do not put service-role or secret keys in browser build variables.

Desktop update selection uses the v2 repository and filters releases to the
installed app major. Stable builds exclude prereleases; beta builds may use
stable or prerelease releases from that same major. If no eligible release is
found, automatic update setup is skipped instead of falling back to the
unfiltered `releases/latest/download` endpoint. `APP_UPDATE_URL` remains an
explicit operator override. Already-installed binaries keep the repository
URL compiled into their version, so preserve the legacy release assets until
the old-client bridge is built and verified; see the
[repository migration runbook](/contributing/repository-migration).

Changesets selects npm dist-tags from its prerelease state (`beta` while the
repository is in beta mode, and `latest` for stable releases). Desktop GitHub
releases are marked as prereleases when the shared version contains `-`.

## Verify and recover

Inspect the single **CI & Release** Actions run: CLI npm publication, each desktop
build, and the final GitHub release publication. Confirm the npm version and
desktop tag match, and inspect the installer assets and macOS checks. A desktop
version mismatch fails before packaging; missing artifacts fail upload.

If desktop packaging or GitHub publication fails after npm publication,
use **Re-run failed jobs** on that run. This keeps the successful npm job and
retries the desktop work for the same version. Re-running the entire workflow
will skip desktop publication if Changesets finds the CLI version already on
npm. Do not delete or move tags as a generic recovery step, or attempt to
republish an existing npm version. npm and GitHub publication are separate
operations, so a failed desktop build can leave the CLI available first.

See [Develop Pipelab](/contributing/development) for local build commands and
[CLI installation](/cli/installation) for the user-facing CLI package.
