# Install and start Pipelab

Download a published desktop release from the
[Pipelab GitHub releases page](https://github.com/CynToolkit/v2/releases/latest).
Release assets are generated for Linux x64, Windows x64, macOS x64, and macOS
arm64. The release formats are a Windows NSIS installer (`.exe`), macOS DMG and ZIP,
and Linux AppImage and ZIP. Minimum operating-system versions and Linux distribution
compatibility are not specified by the release configuration.

The website download cards select assets by filename, and those filters do not
currently match every name produced by the desktop release workflow. If a card
does not offer the right file, use the GitHub releases page and choose an asset
for your operating system and architecture.

macOS prereleases may be ad-hoc signed and not notarized until Apple release
credentials are configured. Gatekeeper may block first launch; approve that
app with Apple's per-app [Open Anyway](https://support.apple.com/en-us/102445)
flow. Do not disable Gatekeeper globally. These prereleases may require manual
installation from the GitHub release page.

## First launch

1. Open the downloaded installer or application archive for your system.
2. Start Pipelab. The packaged desktop app starts or resolves its local CLI
   server in the background.
3. Navigation appears while the local agent starts. Projects and workflows
   show loading states in the dashboard; other screens load their data when
   opened. Saved interface preferences and account plan checks load in the
   background without blocking the dashboard.
4. If the agent is unavailable, navigation remains visible, but actions that
   need the agent are disabled. Use **Reconnect** for connection failures or
   **Retry** in a section whose data failed to load. If it stays disconnected, see
   [startup troubleshooting](/guide/troubleshooting#desktop-startup).

The release artifacts show which operating systems and architectures are
built. They do not establish a minimum OS version or prove that every Linux
distribution has been tested.

## Updating

The packaged desktop app checks for newer releases on its installed channel.
Windows, macOS, and Linux AppImage installs can update through the app. Other
Linux installs offer a manual download. To move between Stable and Beta, use
the [update channel picker](/guide/settings-account-updates#desktop-updates).

For local development instructions, see [Develop Pipelab](/contributing/development).
