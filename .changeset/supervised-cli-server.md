---
"@pipelab/app": patch
"@pipelab/cli": patch
"@pipelab/core-node": patch
---

Desktop now bundles the CLI server (`@pipelab/cli/serve`) and runs it as a supervised child process instead of spawning the separate CLI executable. If the server crashes, Desktop kills everything it started, restarts it, and reloads the window instead of closing. Quitting cancels in-flight workflow runs. An installed Desktop app can run any CLI command, including `serve`, without a separate install with `Pipelab cli <command and options>`.
