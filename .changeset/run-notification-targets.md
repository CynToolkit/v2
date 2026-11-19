---
"@pipelab/shared": minor
"@pipelab/providers": minor
"@pipelab/core-node": minor
"@pipelab/ui": minor
"@pipelab/cli": minor
"@pipelab/app": minor
---

Add notification targets. A workflow can announce a finished run to Discord, Slack or any HTTPS webhook, with a message template, from the app and from the CLI alike. Webhook URLs are saved as connections, delivery is retried and never fails the run, and the existing success and failure switches now apply to every target. Each target chooses its events: a run succeeds, a run fails, or a named destination is deployed or fails. Targets without a choice keep announcing every finished run. A cancelled run never notifies.
