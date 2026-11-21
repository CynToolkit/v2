---
"@pipelab/core-node": patch
"@pipelab/app": patch
---

An invalid build history file no longer blocks startup: it is moved aside as `*.history.json.invalid-<timestamp>` and an error naming the file is logged, so that project starts with an empty history. When the background server exits during Desktop startup, the startup error now shows its last output instead of a generic ERR_FAILED.
