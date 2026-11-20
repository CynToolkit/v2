---
"@pipelab/migration": patch
"@pipelab/shared": patch
---

Migrators now check the migrated state against the schema of the latest version. Settings, connections and project files missing keys that older builds did not write get their defaults, unknown keys are dropped, and a file that still does not match is treated as corrupted (backed up, then reset to defaults). Migrating to an older version is now `migrateTo`.
