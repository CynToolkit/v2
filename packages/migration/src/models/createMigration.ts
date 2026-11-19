import {
  MigrationFn,
  MigrationObjInput,
  MigrationClass,
  MigrationSchema,
  OmitVersion,
  SemVer,
} from "./migration";

export function createMigration<Current extends MigrationSchema, Up extends MigrationSchema>(
  migration: MigrationObjInput<Current, Up>,
): MigrationClass<Current, Up> {
  return {
    version: migration.version,
    up: async (state, nextVersion) => {
      const migrated = (await migration.up(state, nextVersion)) as unknown as Up;
      return { ...migrated, version: nextVersion as SemVer };
    },
  };
}

export const finalVersion = () => {
  throw new Error("Unable to go up on the final version!");
};
