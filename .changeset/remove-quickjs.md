---
"@pipelab/shared": patch
"@pipelab/core-node": patch
"@pipelab/ui": patch
---

Remove the unused QuickJS runtime and its helpers from the shared package, and tighten the Editor Content-Security-Policy so it no longer allows WebAssembly compilation.
