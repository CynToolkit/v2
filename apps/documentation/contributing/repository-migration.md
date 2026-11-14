# Repository migration operations

This runbook covers the move from `CynToolkit/pipelab` to `CynToolkit/v2`. The
imported Git history came from legacy `develop` at
`d497fd91fa4611d232ae458245b8b9da841926f1`; v2 `main` now contains that history
and the repository-migration follow-up. Legacy `main` at
`04bb8a77e1e35dac405fc3174637e720fa9a4804` was not the import source. No tags
were imported. Git history does not transfer repository settings, issues, PRs,
releases, Actions history, secrets, or integrations.

## Configure v2 before enabling Actions

Actions are currently disabled in v2. Keep them disabled until the required
secrets, Cloudflare targets, permissions, and branch protections below are
ready. No deployment, billing operation, or release is performed by this
runbook.

Create a `main` ruleset or branch protection rule. Set required reviews and
required CI checks after the first safe CI run reports its exact check names.
Review who can push, bypass reviews, and create release tags. Confirm Actions
workflow permissions, fork-PR policy, Dependabot, webhooks, GitHub Apps, and
organization policies. These settings are not part of the Git import.

### Actions secrets

Configure only the credentials for services that v2 will use. Do not put
secret values in Git, issues, logs, or documentation. Confirm each target
project and account with its owner before adding values.

| Secret                                                                | Used for                                                                                  |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`                                                | Automatic Pages deployments; scope it to the intended v2 Pages projects.                  |
| `CLOUDFLARE_ACCOUNT_ID`                                               | Cloudflare account containing the v2 Pages projects.                                      |
| `CLOUDFLARE_EDITOR_UI_PROJECT_NAME`                                   | Editor UI Pages project.                                                                  |
| `CLOUDFLARE_PAGES_PROJECT_NAME`                                       | Website Pages project.                                                                    |
| `CLOUDFLARE_DOCS_PROJECT_NAME`                                        | Documentation Pages project.                                                              |
| `SUPABASE_URL`                                                        | Production main builds and deploys.                                                       |
| `SUPABASE_PUBLISHABLE_KEY`                                            | Production client builds; workflows temporarily accept `SUPABASE_ANON_KEY` as a fallback. |
| `SUPABASE_PROJECT_ID`                                                 | Production client builds.                                                                 |
| `POSTHOG_API_KEY`                                                     | Product telemetry in builds.                                                              |
| `CERTIFICATE_OSX_APPLICATION`, `CERTIFICATE_OSX_APPLICATION_PASSWORD` | macOS signing.                                                                            |
| `APPLE_ID`, `APPLE_ID_PASSWORD`, `APPLE_TEAM_ID`                      | macOS notarization.                                                                       |
| `NPM_TOKEN`                                                           | Publishing `@pipelab/cli` to npm from its release tag.                                    |
| `CONSTRUCT_CI_USERNAME`, `CONSTRUCT_CI_PASSWORD`                      | Optional authenticated Construct acceptance dispatch.                                     |

The destination project identifiers and secret values have not been migrated.
Set the three Pages project-name secrets to the intended v2 projects; do not
reuse a legacy value without confirming its target. Deploy jobs fail with a
clear missing-secret error when required Cloudflare values are absent.

### Automatic workflow behavior

| Event                                              | CI and deployment behavior                                                                                                                                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Push to `main`                                     | Run CI and deploy the editor, website, and documentation to their configured v2 Pages projects on branch `main` when matching paths change. Production Supabase values are available to main builds. |
| Pull request targeting `main` from this repository | Run CI and deploy Pages previews on a unique `pr-<number>` branch. Preview builds omit Supabase values. Editor and website previews post their deployment URL to the PR.                             |
| Pull request targeting `main` from a fork          | Run CI and documentation build validation. Secret-bearing editor, website, and documentation deployment jobs are skipped.                                                                            |
| Manual dispatch from `main`                        | Retry an editor, website, or documentation production deployment without a code push. Dispatches from other branches do not deploy.                                                                  |
| `@pipelab/app@<version>` tag                       | Build and publish a desktop GitHub Release.                                                                                                                                                          |
| `@pipelab/cli@<version>` tag                       | Build and publish the CLI package to npm.                                                                                                                                                            |

Deploy workflows use `pull_request` and check that the PR head repository is
the same repository before running jobs that can access secrets. They do not
use `pull_request_target`. A fork PR still receives the general CI workflow and
documentation build, without Cloudflare or production Supabase credentials.

Cloudflare project names and domains are not encoded in these workflows.
Configure each v2 Pages project's production branch as `main`, then attach the
intended custom domains and DNS records manually in Cloudflare. Deployments
only upload build output to the configured project and branch; they never
create or modify Pages custom domains or DNS records. PR preview branches are
`pr-<number>` and use the Pages preview URL until an owner configures a custom
preview domain separately. The previous docs workflow managed
`docs-v2.pipelab.app` as a preview alias; if retaining it, an owner must choose
and configure its stable preview branch manually. The automatic workflow does
not retarget this domain to individual PR branches.

Production authentication and billing use the configured Supabase client
values on main builds and deployments. Same-repository and fork PR previews
omit those values. Configure the intended Supabase project, Auth URLs,
OAuth/email settings, worker bindings, and Polar billing independently; this
repository change does not deploy Supabase functions or change billing
products. Never place service-role or secret keys in client builds.

## Releases and existing desktop installations

The legacy repository currently holds the v1.42.3 release and the
`@pipelab/app@2.0.0-beta.33` prerelease with Windows installer/update assets
and a macOS DMG. Git import did not transfer these release records, assets, or
tags. Matching v2 version tags start publishing automatically; review each
version and publication target before creating a tag. Do not copy old tags
wholesale.

New builds read desktop releases from `CynToolkit/v2`. Already-installed
binaries retain the repository URL compiled into their version and continue
to query `CynToolkit/pipelab`. Keep the old release page and required assets
available until an old-client bridge has been produced and tested on supported
Windows and macOS installations. This migration does not publish a bridge
build.

The website download page and desktop release links now point to v2. Users
needing older releases should continue to use the legacy repository until the
bridge and release decisions are complete. Historical changelog entries and
their old PR/commit links intentionally remain pointed at the old repository.

## Deferred pull requests and remaining work

The import does not move open PRs, reviews, comments, draft state, or branch
metadata. Legacy PRs #135, #112, and #52 remain to be dispositioned. Review
each diff against v2 `main`; preserve desired changes by adapting them on a v2
branch and opening a new v2 PR. Close or mark the old PR with its replacement
link when appropriate. Do not assume old branches merge cleanly or that
comments and reviews transfer.

Before enabling Actions, configure the v2 secrets and Cloudflare Pages projects
above, review the automatic triggers and `main` ruleset, and decide how to
handle those three legacy PRs. After Actions are enabled, verify CI and the
automatic PR preview on a same-repository PR. Confirm production deployment
targets and Supabase billing configuration with their owners before merging
deployment changes to `main`. Test the old-client bridge before retiring
legacy release access.

Archiving or deleting the old repository is a separate owner decision and is
not an automatic migration step.
