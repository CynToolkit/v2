# @pipelab/migration

Generic version-migration helpers for versioned JSON documents. Each document
type declares its migrations in order; `Migrator.migrate` upgrades a state one
version at a time and leaves downgrades untouched.

Pipelab's own config documents (settings, projects, connections) currently have
a single version each, so their migrators only hold the final-version step.
Add a new `createMigration` entry when a document schema changes.
