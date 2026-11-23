---
"@pipelab/app": patch
"@pipelab/core-node": patch
---

Desktop no longer fails to start when the background server hits an error right after launch. An unreadable saved sign-in now signs you out instead of crashing the server, stray background errors no longer stop the server, and Desktop waits for a restarted server before loading the UI. Startup errors now explain what failed and what to do.
