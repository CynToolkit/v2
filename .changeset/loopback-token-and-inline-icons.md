---
"@pipelab/app": patch
"@pipelab/core-node": patch
"@pipelab/shared": patch
"@pipelab/ui": patch
---

The Desktop server now requires a per-launch token on its loopback WebSocket, so other local processes and users can no longer connect and run workflows. A configured token is enforced on loopback binds for `serve` too. The unused `/media-file/` route, which could read any local file path, and the `transformUrl` helper were removed; provider icons are already inline data URIs.
