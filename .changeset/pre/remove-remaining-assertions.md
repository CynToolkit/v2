---
"@pipelab/ui": patch
"@pipelab/shared": patch
"@pipelab/migration": patch
"@pipelab/workflow-runtime": patch
---

Remove more unchecked type assertions. The editor now validates what Electron returns for native dialogs, migrators require a `defaultValue`, and `runWorkflow` requires `services` whenever its tasks need them.
