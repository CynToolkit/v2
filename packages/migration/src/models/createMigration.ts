import {
  MigrationFn,
  MigrationObjInput,
  MigrationClass,
  MigrationSchema,
  OmitVersion,
  isSemVer,
} from "./migration";

export function createMigration<Current extends MigrationSchema, Up extends MigrationSchema>(
  migration: MigrationObjInput<Current, Up>,
): MigrationClass<Current, Up> {
  return {
    version: migration.version,
    up: async (state, nextVersion) => {
      const migrated = await migration.up(state, nextVersion);
      if (!isSemVer(nextVersion)) throw new Error(`"${nextVersion}" is not a valid version`);
      return { ...migrated, version: nextVersion };
    },
  };
}

export const finalVersion = () => {
  throw new Error("Unable to go up on the final version!");
};
