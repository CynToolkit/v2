---
"@pipelab/app": patch
"@pipelab/core-node": patch
"@pipelab/shared": patch
"@pipelab/ui": patch
"@pipelab/cli": patch
---

Encrypt Desktop Cloud sessions with a key in the operating system credential store. When the store is unavailable, ask before saving the session without encryption. Keep session tokens out of sign-in responses and WebSocket logs. Sign-out in the editor ends the current session and reports failures.
