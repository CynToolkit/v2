---
"@pipelab/providers": patch
"@pipelab/shared": patch
"@pipelab/core-node": patch
"@pipelab/ui": patch
---

The editor now builds its provider catalog from a browser-safe `@pipelab/providers/metadata` entry instead of a generated file, so building the editor no longer modifies tracked files. Release definitions are split into catalog descriptors and host-only implementations.
