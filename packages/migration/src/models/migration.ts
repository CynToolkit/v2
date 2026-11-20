import * as semver from "semver";
import { coerce } from "semver";
import { objectKeys } from "../utils/object-keys";
import { klona } from "klona";
import { custom, type GenericSchema, type InferOutput, object, safeParse } from "valibot";

export type Awaitable<T> = Promise<T> | T;

export type MigrationFn<From, To> = (state: From, targetVersion: string) => Awaitable<To>;

export interface MigrateOptions {
  debug?: boolean;
  onStep?: (state: MigrationSchema, version: SemVer) => Promise<void> | void;
}

/** A state between two versions: only `version` is statically known. */
export type MigrationState = MigrationSchema & Record<string, unknown>;

/** Matches a `major.minor.patch` version string. */
export const SemVerSchema = custom<SemVer>(
  (input) => typeof input === "string" && /^\d+\.\d+\.\d+$/.test(input),
);

const MigrationSchemaValidator = object({ version: SemVerSchema });

export type MigrationSchema = InferOutput<typeof MigrationSchemaValidator>;

export type OmitVersion<T> = Omit<T, keyof MigrationSchema>;

export type SemVer = `${number}.${number}.${number}`;

export const isSemVer = (value: string): value is SemVer => /^\d+\.\d+\.\d+$/.test(value);

export interface MigrationClass<Current, Up> {
  version: SemVer;
  up: MigrationFn<Current, OmitVersion<Up> & MigrationSchema>;
}

export interface MigrationObjInput<Current, Up> {
  version: SemVer;
  up: MigrationFn<OmitVersion<Current>, OmitVersion<Up>>;
}

export interface MigratorConfig<InitialState, FinalState> {
  migrations: MigrationClass<any, any>[];
  coerce?: boolean;
  /** State used when there is nothing persisted yet; also seeds new files. */
  defaultValue: FinalState;
  /** Describes the state of the latest version; `migrate` returns only states that match it. */
  schema: GenericSchema<unknown, FinalState>;
}

/** The migrated state does not match the schema of the latest version. */
export class MigrationValidationError extends Error {
  constructor(public readonly issues: readonly string[]) {
    super(`Migrated state is not valid: ${issues.join("; ")}`);
    this.name = "MigrationValidationError";
  }
}

export class Migrator<InitialState extends MigrationSchema, OutputState extends MigrationSchema> {
  current: SemVer;

  migrations: Record<SemVer, MigrationClass<any, any>> = {};

  coerce: boolean;
  defaultValue: OutputState;
  schema: GenericSchema<unknown, OutputState>;

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

    this.defaultValue = config.defaultValue;
    this.schema = config.schema;

    const versions = this.getVersions();
    this.current = versions[versions.length - 1];
    this.coerce = config?.coerce ?? true;
  }

  getVersions() {
    const keys = objectKeys(this.migrations);
    return semver.sort(keys);
  }

  /** Migrates `state` to the latest version and checks the result against the schema. */
  async migrate(
    state: MigrationSchema | undefined,
    options?: MigrateOptions,
  ): Promise<OutputState> {
    const migrated = await this.run(state, undefined, options);
    return this.validate(migrated);
  }

  /** Migrates `state` up to `target`. The result is an intermediate version, so it is not validated. */
  migrateTo(
    state: MigrationSchema | undefined,
    target: SemVer,
    options?: MigrateOptions,
  ): Promise<MigrationState> {
    return this.run(state, target, options);
  }

  /** Missing keys take their default, then the result must match the latest version's schema. */
  private validate(state: MigrationState): OutputState {
    const result = safeParse(this.schema, { ...this.defaultValue, ...state });
    if (!result.success) {
      throw new MigrationValidationError(
        result.issues.map((issue) => {
          const path = issue.path?.map((item) => String(item.key)).join(".");
          return path ? `${path}: ${issue.message}` : issue.message;
        }),
      );
    }
    return result.output;
  }

  private async run(
    _state: MigrationSchema | undefined,
    explicitTarget: SemVer | undefined,
    options?: MigrateOptions,
  ): Promise<MigrationState> {
    const state = _state ?? this.defaultValue;
    const currentVersion = this.tryCoerce(state.version);
    const targetVersion = this.tryCoerce(explicitTarget ?? this.current);

    if (options?.debug) {
      console.log("Migrating from", currentVersion, "to", targetVersion);
    }

    let finalState: MigrationState = klona(state);
    const versions = this.getVersions();
    const currentIndex = versions.indexOf(currentVersion);
    const targetIndex = versions.indexOf(targetVersion);

    if (currentIndex === -1) {
      if (
        explicitTarget === undefined &&
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
      return finalState;
    }

    // Get the migration path
    const isUpgrade = currentIndex < targetIndex;

    if (!isUpgrade) {
      return finalState;
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

    return finalState;
  }

  tryCoerce(version: SemVer): SemVer {
    if (!this.coerce) return version;
    const coerced = coerce(version)?.version;
    return coerced !== undefined && isSemVer(coerced) ? coerced : version;
  }

  needMigration(version: SemVer) {
    const newVersion = this.tryCoerce(version);
    return semver.lt(newVersion, this.current);
  }
}
