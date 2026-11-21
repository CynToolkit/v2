# @pipelab/migration

## 1.0.0-beta.33

### Patch Changes

- [#74](https://github.com/CynToolkit/v2/pull/74) [`a0c10dd`](https://github.com/CynToolkit/v2/commit/a0c10ddcbb5440880e0fe92ecf1f36b3cf1aa194) Thanks [@Armaldio](https://github.com/Armaldio)! - Migrators now check the migrated state against the schema of the latest version. Settings, connections and project files missing keys that older builds did not write get their defaults, unknown keys are dropped, and a file that still does not match is treated as corrupted (backed up, then reset to defaults). Migrating to an older version is now `migrateTo`.

- [#56](https://github.com/CynToolkit/v2/pull/56) [`081f15f`](https://github.com/CynToolkit/v2/commit/081f15f887ae0d8bef1238a5e866eae96e684c73) Thanks [@Armaldio](https://github.com/Armaldio)! - Remove backward-compatibility code: the Stable/Beta data import, old settings and project index versions, Release configuration 3.0.0, the legacy build-history shape and `pipelines` directory, deprecated provider aliases, and the `SUPABASE_ANON_KEY` fallback. Builds now read `SUPABASE_PUBLISHABLE_KEY` only.

- [#71](https://github.com/CynToolkit/v2/pull/71) [`e38d460`](https://github.com/CynToolkit/v2/commit/e38d460484e04541bd03df97cd5c8c509513bc3f) Thanks [@Armaldio](https://github.com/Armaldio)! - Remove more unchecked type assertions. The editor now validates what Electron returns for native dialogs, migrators require a `defaultValue`, and `runWorkflow` requires `services` whenever its tasks need them.

## 1.0.0-beta.32

Initial prerelease of the new Pipelab v2 product.
