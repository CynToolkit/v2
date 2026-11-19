import * as semver from "semver";
import { coerce } from "semver";
import { objectKeys } from "../utils/object-keys";
import { klona } from "klona";
import { custom, InferOutput, object } from "valibot";

export type Awaitable<T> = Promise<T> | T;

export type MigrationFn<From, To> = (state: From, targetVersion: string) => Awaitable<To>;

export type MigrateOptions = {
  debug?: boolean;
  target?: SemVer;
  onStep?: (state: any, version: SemVer) => Promise<void> | void;
};

const MigrationSchemaValidator = object({
  version: custom<SemVer>((input) => typeof input === "string" && /^\d+\.\d+\.\d+$/.test(input)),
});

export type MigrationSchema = InferOutput<typeof MigrationSchemaValidator>;

export type OmitVersion<T> = Omit<T, keyof MigrationSchema>;

export type SemVer = `${number}.${number}.${number}`;

export interface MigrationClass<Current, Up> {
  version: SemVer;
  up: MigrationFn<Current, Up>;
}

export interface MigrationObjInput<Current, Up> {
  version: SemVer;
  up: MigrationFn<OmitVersion<Current>, OmitVersion<Up>>;
}

export interface MigratorConfig<InitialState, FinalState> {
  migrations: MigrationClass<any, any>[];
  coerce?: boolean;
  defaultValue?: FinalState;
}

export class Migrator<InitialState extends MigrationSchema, OutputState extends MigrationSchema> {
  current: SemVer;

  migrations: Record<SemVer, MigrationClass<any, any>> = {};

  coerce: boolean;
  defaultValue: OutputState;

  constructor(config: MigratorConfig<InitialState, OutputState>) {
    if (config.migrations.length === 0) {
      throw new Error("A migrator needs at least one migration");
    }
    config.migrations.forEach((migration) => {
      if (this.migrations[migration.version]) {
        throw new Error(`Duplicate migration for version "${migration.version}"`);
      }
      this.migrations[migration.version] = migration;
    });

    this.defaultValue = config?.defaultValue ?? ({} as OutputState);

    const versions = this.getVersions();
    this.current = versions[versions.length - 1];
    this.coerce = config?.coerce ?? true;
  }

  getVersions() {
    const keys = objectKeys(this.migrations);
    return semver.sort(keys);
  }

  async migrate(
    _state: MigrationSchema | undefined,
    options?: MigrateOptions,
  ): Promise<OutputState> {
    const state = _state ?? this.defaultValue;
    const currentVersion = this.tryCoerce(state.version);
    const targetVersion = this.tryCoerce(options?.target ?? this.current);

    if (options?.debug) {
      console.log("Migrating from", currentVersion, "to", targetVersion);
    }

    let finalState = klona(state) as any; // Using any here because we'll be transforming between versions
    const versions = this.getVersions();
    const currentIndex = versions.indexOf(currentVersion);
    const targetIndex = versions.indexOf(targetVersion);

    if (currentIndex === -1) {
      if (
        !options?.target &&
        semver.valid(currentVersion) &&
        semver.gt(currentVersion, this.current)
      ) {
        throw new Error(
          `Current version "${currentVersion}" is newer than the latest known version "${this.current}"`,
        );
      }
      throw new Error(`Current version "${currentVersion}" not found in migrations`);
    }
    if (targetIndex === -1) {
      throw new Error(`Target version "${targetVersion}" not found in migrations`);
    }

    // If we're already at the target version, return the state
    if (currentIndex === targetIndex) {
      return finalState as OutputState;
    }

    // Get the migration path
    const isUpgrade = currentIndex < targetIndex;

    if (!isUpgrade) {
      return finalState as OutputState;
    }

    // Perform migrations
    for (let i = currentIndex; i < targetIndex; i++) {
      const currentVersion = versions[i];
      const nextVersion = versions[i + 1];

      if (options?.debug) {
        console.log("\tMigrating to version:", nextVersion);
      }

      const migrationVersion = currentVersion;
      const migration = this.migrations[migrationVersion];

      // Remove version before migration
      const { version: _, ...stateWithoutVersion } = finalState;

      // Perform migration
      const migratedState = await migration.up(stateWithoutVersion, nextVersion);

      // Add new version
      finalState = {
        ...migratedState,
        version: nextVersion,
      };

      if (options?.onStep) {
        await options.onStep(finalState, nextVersion);
      }

      if (options?.debug) {
        console.log("\tMigrated state:", finalState);
      }
    }

    return finalState as OutputState;
  }

  tryCoerce(version: SemVer): SemVer {
    return this.coerce ? ((coerce(version)?.version as SemVer | undefined) ?? version) : version;
  }

  needMigration(version: SemVer) {
    const newVersion = this.tryCoerce(version);
    return semver.lt(newVersion, this.current);
  }
}
