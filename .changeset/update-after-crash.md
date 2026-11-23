---
"@pipelab/app": patch
"@pipelab/ui": patch
"@pipelab/core-node": patch
---

Pipelab can now check for and install updates even when its background server fails to start or keeps crashing. The error dialog offers "Check for updates", so a newer version that fixes the problem can be installed without the app working first. The dashboard no longer shows raw technical errors when projects cannot be loaded; the details stay in the terminal log.

An unreadable project index or connections file (old format or corrupt file) is now backed up next to the original as `<file>.invalid-<timestamp>` and replaced by a default, so Pipelab keeps working as if nothing was saved.
