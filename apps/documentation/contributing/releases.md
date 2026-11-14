# Release Pipelab

This runbook covers releases of the Pipelab application and CLI themselves. It is separate from user-authored **Release workflows**, which build or deliver a user's game. A game workflow does not create a Pipelab GitHub Release or publish the CLI to npm.

## Version and tag flow

The repository uses Changesets. The root README documents this sequence:

```sh
pnpm changeset
pnpm changeset version
pnpm changeset tag
```

Review the generated version changes before publishing. The desktop and CLI have distinct package versions and distinct tag-triggered workflows; each workflow checks that its tag matches the corresponding package manifest. The `.changeset/config.json` links the CLI and UI packages for versioning, but the release workflows still use their own exact tag prefixes:

| Product | Tag | Workflow | Publication |
| --- | --- | --- | --- |
| Desktop app | `@pipelab/app@<version>` | `.github/workflows/release.yml` | GitHub Release with generated desktop assets |
| CLI | `@pipelab/cli@<version>` | `.github/workflows/release-cli.yml` | Public npm package `@pipelab/cli` |

Both workflows use Node 24.15.0 and frozen pnpm installs. Push the intended version tag only after the matching package version is committed and reviewed.

In the v2 repository, tag-triggered publishing jobs run only when the
repository variable `ENABLE_RELEASE_PUBLISHING` is exactly `true`. Keep it
unset until the release target, token permissions, signing credentials, and
old-client update bridge have been reviewed. The workflow details and
migration gates are in the [repository migration runbook](/contributing/repository-migration).

## Desktop GitHub release

The desktop workflow builds these matrix entries:

- Linux x64
- Windows x64
- macOS x64
- macOS arm64

Forge is configured for Windows Squirrel outputs, Linux ZIP, and macOS DMG on release builds. The workflow uploads files produced by Forge, verifies macOS executable architecture and code signature, then publishes or updates the same-tag GitHub Release. Tags containing `-` mark the GitHub Release as a prerelease. The release asset glob also accepts `.deb` and `.rpm`, but those patterns do not mean Forge currently creates those formats.

The workflow references these secret names; configure values in GitHub Actions secrets only when release publishing and the intended Supabase project are approved. Build environments receive Supabase values only when `ENABLE_PRODUCTION_BILLING=true`. Never place secret values in this documentation:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` (falls back to the legacy `SUPABASE_ANON_KEY` while migrating)
- `SUPABASE_PROJECT_ID`
- `POSTHOG_API_KEY`
- `CERTIFICATE_OSX_APPLICATION`
- `CERTIFICATE_OSX_APPLICATION_PASSWORD`
- `APPLE_ID`
- `APPLE_ID_PASSWORD`
- `APPLE_TEAM_ID`

Apple signing/notarization is enabled by Forge only when all required Apple credentials are present. CI imports the certificate on macOS jobs and performs architecture and signature checks before upload. GitHub's workflow token is used for release publication.

## CLI npm release

The CLI workflow checks `@pipelab/cli@<version>`, builds the bundled CLI and UI, then validates the staged package manifest, `pipelab` and `plab` bins, bundled UI, assets, and npm pack contents before publishing publicly. It requires the `NPM_TOKEN` Actions secret for npm authentication. It passes `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (falling back to the legacy `SUPABASE_ANON_KEY` secret), and `SUPABASE_PROJECT_ID` only when `ENABLE_PRODUCTION_BILLING=true`; `POSTHOG_API_KEY` is independent of that gate.

For the Supabase key-name rollout, add `SUPABASE_PUBLISHABLE_KEY` to Doppler and GitHub Actions secrets first. Production builds prefer it and temporarily fall back to `SUPABASE_ANON_KEY`; v2 preview builds omit Supabase values. Verify Editor, Website, Desktop, and CLI authentication before removing the old secret in a separate approved change. Do not put service-role or secret keys in browser build variables.

Desktop update selection uses the v2 repository and filters releases to the
installed app major. Stable builds exclude prereleases; beta builds may use
stable or prerelease releases from that same major. If no eligible release is
found, automatic update setup is skipped instead of falling back to the
unfiltered `releases/latest/download` endpoint. `APP_UPDATE_URL` remains an
explicit operator override. Already-installed binaries keep the repository
URL compiled into their version, so preserve the legacy release assets until
the old-client bridge is built and verified; see the
[repository migration runbook](/contributing/repository-migration).

For a version containing a prerelease segment, the workflow derives the npm dist-tag from the segment before the first dot (for example, `beta` from `2.0.0-beta.4`). A version without a prerelease segment publishes with `latest`. This is npm dist-tag behavior; it is distinct from the desktop GitHub prerelease flag.

## Verify and recover

After pushing a tag, inspect the Actions run for the matching workflow and confirm every build/package validation and publication step completed. For desktop releases, inspect the generated assets and macOS checks; for CLI releases, confirm package validation and the npm publish step. A tag/package version mismatch fails before publication, and missing desktop artifacts fail the upload gate.

The workflows do not define an automated rollback procedure. The desktop publication step updates files on the same tag, and the CLI job publishes a version to npm; treat retries and corrections as operator actions. Inspect the workflow run and current published tag/package state before deciding how to correct a failed or partial release. Do not delete or move tags as a generic recovery step.

See [Develop Pipelab](/contributing/development) for local build commands and [CLI installation](/cli/installation) for the user-facing CLI package.
