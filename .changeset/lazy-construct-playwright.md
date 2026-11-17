---
"@pipelab/providers": patch
"@pipelab/core-node": patch
"@pipelab/app": patch
"@pipelab/cli": patch
---

Load Construct's cached Playwright runtime on demand instead of requiring it at application startup. Download automation tools only when inspecting a browser profile or exporting a Construct project.
