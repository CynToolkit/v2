---
"@pipelab/providers": patch
"@pipelab/asset-electron": patch
"@pipelab/core-node": patch
"@pipelab/ui": patch
---

Electron game builds with the default configuration now install from a bundled lockfile, so they are reproducible and work from the local pnpm cache. Builds that override the Electron version or add custom packages still resolve dependencies fresh. The bundled editor now gets its provider catalog from an in-memory build-time module instead of a generated tracked file, so building it no longer dirties the checkout.
