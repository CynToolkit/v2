---
"@pipelab/shared": minor
"@pipelab/core-node": minor
"@pipelab/providers": minor
"@pipelab/ui": minor
"@pipelab/migration": patch
---

Remove backward-compatibility code: the Stable/Beta data import, old settings and project index versions, Release configuration 3.0.0, the legacy build-history shape and `pipelines` directory, deprecated provider aliases, and the `SUPABASE_ANON_KEY` fallback. Builds now read `SUPABASE_PUBLISHABLE_KEY` only.
