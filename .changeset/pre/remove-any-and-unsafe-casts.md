---
"@pipelab/shared": patch
"@pipelab/core-node": patch
"@pipelab/providers": patch
"@pipelab/ui": patch
---

Remove `any` and unchecked casts across the app. Electron and Tauri workflow inputs are now validated and fall back to their defaults when unset or of the wrong type, provider JSON responses are checked before use, and the IPC and Desktop bridge contracts are typed end to end.
