# CI and deployment setup

This page covers the repository, secrets, and Cloudflare configuration the CI
and deployment workflows depend on. No deployment, billing operation, or
release is performed by changing these settings.

## Configure the repository

Configure the required secrets, Cloudflare targets, permissions, and branch
protections below before enabling deployments in a new environment.

Create a `main` ruleset or branch protection rule. Set required reviews and
required CI checks after the first safe CI run reports its exact check names.
Review who can push, bypass reviews, and create release tags. Confirm Actions
workflow permissions, fork-PR policy, Dependabot, webhooks, GitHub Apps, and
organization policies.

### Actions secrets

Configure only the credentials for services that v2 will use. Do not put
secret values in Git, issues, logs, or documentation. Confirm each target
project and account with its owner before adding values.

| Secret                                                                | Used for                                                                         |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`                                                | Automatic Pages deployments; scope it to the intended v2 Pages projects.         |
| `CLOUDFLARE_ACCOUNT_ID`                                               | Cloudflare account containing the v2 Pages projects.                             |
| `CLOUDFLARE_EDITOR_UI_PROJECT_NAME`                                   | Editor UI Pages project.                                                         |
| `CLOUDFLARE_PAGES_PROJECT_NAME`                                       | Website Pages project.                                                           |
| `CLOUDFLARE_DOCS_PROJECT_NAME`                                        | Documentation Pages project.                                                     |
| `SUPABASE_URL`                                                        | Production main builds and deploys.                                              |
| `SUPABASE_PUBLISHABLE_KEY`                                            | Production client builds;.                                                       |
| `SUPABASE_PROJECT_ID`                                                 | Production client builds.                                                        |
| `POSTHOG_API_KEY`                                                     | Product telemetry in builds.                                                     |
| `CERTIFICATE_OSX_APPLICATION`, `CERTIFICATE_OSX_APPLICATION_PASSWORD` | Optional for macOS prereleases; required for stable signed builds.               |
| `APPLE_ID`, `APPLE_ID_PASSWORD`, `APPLE_TEAM_ID`                      | Optional for macOS prereleases; required for stable signed and notarized builds. |
| `CONSTRUCT_CI_USERNAME`, `CONSTRUCT_CI_PASSWORD`                      | Authenticated Construct acceptance on `main` pushes and dispatches.              |

Set the three Pages project-name secrets to the intended projects and confirm
each target with its owner. Deploy jobs fail with a
clear missing-secret error when required Cloudflare values are absent.

For macOS releases, either leave all five Apple secrets unset for ad-hoc-signed
prereleases or configure all five together. A partial set fails with the names
of the missing secrets. Stable macOS releases require all five.

### Automatic workflow behavior

| Event                                                           | CI and deployment behavior                                                                                                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Push to `main`                                                  | Run CI, then deploy all three web apps to Pages branch `main` and run authenticated Construct acceptance after the CI gate succeeds. Production Supabase values are available to main builds.     |
| Push to `develop`                                               | Run CI, then deploy all three web apps to Pages branch `develop` as previews after the CI gate succeeds. Production Supabase values are omitted.                                                  |
| Pull request targeting `main` or `develop` from this repository | Run CI, then deploy changed web apps as Pages previews on a unique `pr-<number>` branch. Production Supabase values are omitted. Editor and website previews post their deployment URL to the PR. |
| Pull request targeting `main` or `develop` from a fork          | Run CI and documentation build validation. Secret-bearing editor, website, and documentation deployment jobs are skipped.                                                                         |
| Manual dispatch from `main`                                     | Run validation and optionally authenticated Construct acceptance; no deployment or release.                                                                                                       |
| Manual dispatch from `develop`                                  | Run validation and optionally authenticated Construct acceptance; no deployment or release.                                                                                                       |

The single **CI & Release** workflow in `release.yml` uses `changesets/action@v1` to open a
version pull request or publish the CLI to npm on `main`, after **CI passed** succeeds. Desktop, CLI, and UI share one
fixed-group version. After successful npm publication, the same workflow
builds desktop installers and publishes one GitHub release for that version.
Configure npm Trusted Publishing for `@pipelab/cli`: GitHub owner `CynToolkit`,
repository `v2`, workflow filename `release.yml`, no environment, and allow
direct publishing. No npm publishing secret is required. Allow GitHub Actions to
create pull requests in repository settings, and approve workflows on the
generated PR when GitHub requires it. No tag push or separate dispatch is
needed. See [Release Pipelab](/contributing/releases).

### Dependency updates and advisories

Dependabot (`.github/dependabot.yml`) opens weekly update pull requests for the
root pnpm workspace (`npm` ecosystem) and for GitHub Actions. Minor and patch
updates are grouped (production and development dependencies separately; all
Actions together); major updates arrive one package per pull request.

The **Dependency advisories** job in `release.yml` runs
`pnpm audit --prod --audit-level high` against the current advisory database on
every run and is part of **CI passed**. Advisories are published independently
of any code change, so a newly published high or critical advisory can fail
unrelated pull requests until the dependency is updated. Fix it by bumping the
direct dependency, or for a transitive one by adding a patched range to
`resolutions` in the root `package.json`. Lower-severity findings do not fail
the job.

Deployment files use `workflow_call` and are called only after CI succeeds.
The entry workflow checks that the PR head repository is
the same repository before running jobs that can access secrets. They do not
use `pull_request_target`. A fork PR still receives the general CI checks and
documentation build, without Cloudflare or production Supabase credentials.

Cloudflare project names and domains are not encoded in these workflows. The
Pages projects and their production branches are:

| App           | Pages project     | Production branch | Known domain         |
| ------------- | ----------------- | ----------------- | -------------------- |
| Editor        | `pipelab`         | `main`            | `editor.pipelab.app` |
| Website       | `pipelab-website` | `main`            | —                    |
| Documentation | `pipelab-docs`    | `main`            | —                    |

The editor Pages project's production branch must be `main`, like the website
and documentation projects. Cloudflare Pages Direct Upload does not expose this setting in the
dashboard; update the project through the [Cloudflare Pages project API](https://developers.cloudflare.com/pages/get-started/direct-upload/)
with a token that has Pages Edit permission. Attach any additional custom domains and DNS records
manually in Cloudflare. Deployments
only upload build output to the configured project and branch; they never
create or modify Pages custom domains or DNS records. PR preview branches are
`pr-<number>` and use the Pages preview URL until an owner configures a custom
preview domain separately. The previous docs workflow managed
`docs-v2.pipelab.app` as a preview alias; if retaining it, an owner must choose
and configure its stable preview branch manually. The automatic workflow does
not retarget this domain to individual PR branches.

Production authentication and billing use the configured Supabase client
values on `main` builds and deployments. `develop` deployments and same-repository
or fork PR previews omit those values. Configure the intended Supabase project, Auth URLs,
OAuth/email settings, worker bindings, and Polar billing independently; this
repository change does not deploy Supabase functions or change billing
products. Never place service-role or secret keys in client builds.

## Releases and existing desktop installations

The legacy repository currently holds the v1.42.3 release and the
`@pipelab/app@2.0.0-beta.33` prerelease with Windows installer/update assets
and a macOS DMG. Git import did not transfer these release records, assets, or
tags. The shared Changesets release workflow creates new v2 releases after
version PRs merge; review each version and publication target before merging.
Do not copy old tags wholesale.

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
