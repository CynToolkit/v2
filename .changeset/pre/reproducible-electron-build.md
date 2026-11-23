---
"@pipelab/providers": patch
"@pipelab/asset-electron": patch
---

Electron game builds with the default configuration now install from a bundled lockfile, so they are reproducible and work from the local pnpm cache. Builds that override the Electron version or add custom packages still resolve dependencies fresh.
