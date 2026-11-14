# Repository migration operations

This runbook covers the GitHub repository move from `CynToolkit/pipelab` to
`CynToolkit/v2`. The imported history is the legacy `develop` branch at
`d497fd91fa4611d232ae458245b8b9da841926f1`, now the v2 repository's `main`
history. The legacy `main` branch was `04bb8a77e1e35dac405fc3174637e720fa9a4804`;
it was not the source of the import. The import contains Git history but no
tags. Repository settings, issues, pull requests, releases, Actions history,
secrets, and integrations do not move with Git history.

## Configure v2 before enabling workflows

The imported repository initially had Actions enabled and no branch rulesets.
Keep Actions disabled while reviewing and configuring the settings below, then
enable Actions for CI in a controlled step. Do not create a v2 production
deployment, billing operation, or release as a migration check.

Create a `main` ruleset or branch protection rule. Choose required CI checks
after the first safe CI run has reported its exact check names. Review who may
push, bypass reviews, and create release tags. Confirm Actions workflow
permissions, fork-PR policy, Dependabot, webhooks, GitHub Apps, environments,
and organization policies. None of those settings are included in the Git
import.

### Actions variables that control external effects

All variables below are unset by default. Leave them unset until the listed
prerequisites are satisfied.

| Repository variable             | Effect when set to `true`                                                                                                                                                       | Additional control                                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ENABLE_PAGES_DEPLOYMENTS`      | Allows a manually dispatched editor, website, or documentation Pages deployment.                                                                                                | `confirm_deployment` must also be checked. Preview targets use the dedicated `v2-migration-preview` Pages branch.                                                                                          |
| `ENABLE_PRODUCTION_DEPLOYMENTS` | Allows a production Pages deployment.                                                                                                                                           | Requires `ENABLE_PAGES_DEPLOYMENTS`, target `production`, `confirm_deployment`, `confirm_production`, and dispatch from v2 `main`. Production billing remains independently controlled.                    |
| `ENABLE_PRODUCTION_BILLING`     | Allows configured Supabase project values into build environments. Without it, CI and preview builds receive empty Supabase values, so hosted auth and billing are unavailable. | Verify that the project, auth URLs, billing provider, and production ownership are intentionally shared before enabling. This variable does not deploy Supabase functions or change billing configuration. |
| `ENABLE_RELEASE_PUBLISHING`     | Allows desktop GitHub Release and CLI npm publishing jobs to run for matching tags.                                                                                             | Verify tag rules, `GITHUB_TOKEN` permissions, npm ownership/token, signing, and release cutover before enabling.                                                                                           |

Editor, website, and documentation deployments are manual dispatches. A
production deployment requires both deployment variables and explicit
production confirmation from `main`; a push or pull request cannot deploy.
Pull requests to `main` still get documentation build validation. PR preview
deployments are no longer automatic: choose the source branch in **Actions →
Deploy Editor UI** or **Deploy Website**, select `preview`, and confirm the
deployment. Preview uses the `v2-migration-preview` Pages branch, not `main`.
The documentation workflow's preview also uses that Pages branch and retains
the configured `docs-v2.pipelab.app` preview domain. Verify the Cloudflare
project's production branch and custom-domain routing before enabling Pages.

### Secrets to configure only for services being reused

Add values through GitHub's Actions secrets or an approved secret manager; do
not put values in Git, issues, or logs. Confirm each credential's scope and
the exact target project/account before copying it.

- Cloudflare: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`,
  `CLOUDFLARE_EDITOR_UI_PROJECT_NAME`, `CLOUDFLARE_PAGES_PROJECT_NAME`.
- Supabase client builds: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (the
  workflows temporarily accept `SUPABASE_ANON_KEY` as a fallback),
  `SUPABASE_PROJECT_ID`.
- Telemetry: `POSTHOG_API_KEY`.
- Desktop signing/notarization: `CERTIFICATE_OSX_APPLICATION`,
  `CERTIFICATE_OSX_APPLICATION_PASSWORD`, `APPLE_ID`, `APPLE_ID_PASSWORD`,
  `APPLE_TEAM_ID`.
- CLI publication: `NPM_TOKEN`.
- Optional authenticated Construct acceptance: `CONSTRUCT_CI_USERNAME`,
  `CONSTRUCT_CI_PASSWORD`.

The existing Supabase project and billing configuration are not migrated by
this repository change. Production Pages workflows pass Supabase project
values only when `ENABLE_PRODUCTION_BILLING=true`; previews omit those values.
CI and release builds also require that variable before including them. Do
not deploy Supabase functions or alter billing
products as part of repository cutover. Review Supabase Auth allowed URLs,
OAuth/email settings, worker bindings, Polar configuration, and production
ownership separately before enabling production billing or shipping a build
that contains those project values.

## Releases and existing desktop installations

The legacy repository currently holds the published v1.42.3 release and the
`@pipelab/app@2.0.0-beta.33` prerelease, including Windows installer/update
assets and a macOS DMG. Git history import does not transfer those release
records, assets, or tags. The v2 workflows remain blocked until
`ENABLE_RELEASE_PUBLISHING=true`; do not import or recreate old tags wholesale.
Select any historical release/tag migration deliberately and only after
reviewing its workflow side effects, npm version state, and asset provenance.

New builds read desktop releases from `CynToolkit/v2`. This code change does
not change already-installed binaries: they continue to query
`CynToolkit/pipelab`. Keep the old repository's release page and required
assets available until an old-client bridge path has been produced and tested
on supported Windows and macOS installations. Establish and verify that
bridge before retiring legacy release publishing or changing legacy release
availability. This migration does not publish a bridge build.

The website download page and desktop release links now point to v2; users
needing older releases should continue to use the legacy repository until the
bridge and historical release decisions are complete. Historical changelog
entries and their old PR/commit links intentionally remain pointed at the old
repository.

## Deferred pull requests and cutover checklist

The import does not move open PRs, reviews, comments, draft state, or branch
metadata. Legacy PRs #135, #112, and #52 remain to be dispositioned. For each,
review its diff against imported `main`; preserve desired changes by replaying
or adapting them on a v2 branch, then open a new v2 PR. Close or clearly mark
the legacy PR with the v2 replacement link when appropriate. Do not assume the
old branch can merge cleanly or that comments/reviews transfer.

Before enabling production operations:

1. Configure and review v2 settings, secrets, variables, and the `main`
   protection ruleset above.
2. Enable Actions and observe safe CI on a pull request. Keep all four external
   effect variables unset during this check.
3. Review and disposition legacy PRs #135, #112, and #52; verify their desired
   changes on v2 separately.
4. Validate website downloads, updater URLs, Changesets links, npm ownership,
   signing credentials, Cloudflare project/domain routing, and Supabase Auth
   and billing configuration with their respective owners.
5. Test a manually confirmed Pages preview on `v2-migration-preview` before
   considering production. Production requires the dedicated production
   variables, both confirmation inputs, and dispatch from `main`.
6. Verify the old-client bridge on real supported installs before setting
   `ENABLE_RELEASE_PUBLISHING=true` or retiring legacy release access. Review
   any selected tag separately before importing it.

Archiving or deleting the old repository is a separate owner decision and is
not an automatic migration step.
