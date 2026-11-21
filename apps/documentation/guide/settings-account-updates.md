# Settings, account, and updates

Open **Settings** from the sidebar to adjust local application preferences.
Some sections are only available when signed in or when Pipelab is running in
development mode.

## General and advanced settings

The General section includes autosave, theme, language, and onboarding tour
controls. Advanced settings include storage and cache information and related
controls. Changes that require a restart are labelled in the app.

Built-in providers ship with Pipelab and are available together. Settings do not
install, uninstall or disable providers. Existing settings files are upgraded
automatically; the unused `plugins[].enabled` list is discarded while theme,
language, cache, temporary folders and other preferences are preserved.

An **integration** configures credentials or an account used by a provider.
Manage these profiles on the **Connections** screen. Saved connections keep
their IDs and credentials during the settings upgrade.

Construct, Itch, Poki and Steam connections have a **Test connection** button. It runs a
read-only check (no upload, no login prompt) and shows the result next to the
button. Saving runs the test automatically if the current values were not tested.
A rejected credential, such as an Itch API key that itch.io refuses, blocks
saving until you fix it. If the service cannot be reached, the check times out,
or the connection type cannot be tested, the reason is shown and the connection
still saves. Poki and Steam only check that the name is set and, when possible,
that the CLI login exists; a missing login does not block saving.

## Account

The account dialog supports signing in, creating an account, and requesting a
password reset. Registration may wait for account validation before sign-in is
available. Everything that runs locally, including workflows, run history and
projects, is available on the Free plan. Plans only gate cloud features such as
Cloud Save; the app's upgrade dialog shows the current state.

In the browser app, account sign-in works without the local agent when the
deployment has Supabase configured. The signed-in browser session keeps
account and profile access independent of the optional agent. Billing is
available in every Editor build. Plan lookup, checkout, and the billing portal
use Supabase Edge Functions; account-specific operations require authentication
and the configured billing backend described in the repository's Supabase
setup guide. Missing configuration, network failures, and authorization errors
appear with a retry action instead of an endless loading state or an assumed
Free plan. Allow pop-ups in
the browser to open the billing portal or continue to checkout.

Browser deployments need `SUPABASE_URL` and the public
`SUPABASE_PUBLISHABLE_KEY` at UI build time. Every Editor build uses the
same billing behavior; public Supabase values must be configured for browser
account and billing requests to succeed.
Configure the deployed HTTPS origin as an allowed Supabase Auth redirect URL
and serve the UI's `/auth/callback` route through the SPA fallback.
Email verification returns to the hosted app, while password-reset links open a
page to choose a new password. Desktop keeps its `pipelab://` verification
return flow. Privileged Supabase and billing secrets stay on the server and
must not be added to UI build settings.

If account data fails to load, check the connection and retry. Missing Supabase
configuration shows an actionable setup error. Billing errors do not prevent
profile access or affect the local settings file.

## Desktop updates

In **Settings → General → Update channel**, choose **Stable** to look for
final releases or **Beta** to look for beta prereleases. Automatic updates
follow the installed channel. To switch, select the other channel and open
the offered release to download and install it. Pipelab offers a switch only
when that channel has a strictly newer version. Stable and Beta are separate
installations with separate local data, including workflows and settings.

The packaged desktop app checks for a newer release shortly after launch and
every few hours while it stays open, without delaying startup. Windows, macOS and
Linux AppImage installs download the update in the background, show the
download progress in the sidebar, and ask you to restart when it is ready; if
the download fails, the sidebar shows a download link instead. Other Linux
installs show the manual download link. Update
checks are disabled in development builds. Unsigned macOS prereleases may require manual
installation and per-app Gatekeeper approval; in-app updates are not verified
for those builds.

For release formats, see [Install and start Pipelab](/guide/installation). For
startup and sign-in issues, see [Troubleshooting](/guide/troubleshooting).
