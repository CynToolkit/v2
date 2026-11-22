---
"@pipelab/app": patch
"@pipelab/cli": patch
---

CLI usage telemetry now reports only the command name, never its arguments. Desktop restricts privileged IPC calls and renderer navigation to its own local origin, opens only http and https links in the system browser, and removes the unused `media://` file protocol.
