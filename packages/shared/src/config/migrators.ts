import {
  createMigration,
  createMigrator,
  finalVersion,
  type MigrateOptions,
  SemVer,
} from "@pipelab/migration";
import { AppConfig, ConnectionsConfig } from "../config.schema";
import { FileRepo } from "./projects-definition";

// --- Types ---

export interface Migrator<T> {
  migrate: (data: { version: SemVer }, options?: MigrateOptions) => Promise<T>;
  defaultValue: T;
}

// --- Settings Migrator ---

const settingsMigratorInternal = createMigrator<AppConfig, AppConfig>();

export const defaultAppSettings = settingsMigratorInternal.createDefault({
  locale: "en-US",
  theme: "light",
  version: "1.0.0",
  autosave: true,
  agents: [],
  tours: {
    dashboard: {
      step: 0,
      completed: false,
    },
    editor: {
      step: 0,
      completed: false,
    },
  },
});

export const appSettingsMigrator = settingsMigratorInternal.createMigrations({
  defaultValue: defaultAppSettings,
  migrations: [
    createMigration<AppConfig, never>({
      version: "1.0.0",
      up: finalVersion,
    }),
  ],
});

// --- Connections Migrator ---

const connectionsMigratorInternal = createMigrator<ConnectionsConfig, ConnectionsConfig>();

export const defaultConnections = connectionsMigratorInternal.createDefault({
  version: "1.0.0",
  connections: [],
});

export const connectionsMigrator = connectionsMigratorInternal.createMigrations({
  defaultValue: defaultConnections,
  migrations: [
    createMigration<ConnectionsConfig, never>({
      version: "1.0.0",
      up: finalVersion,
    }),
  ],
});

// --- Projects Migrator ---

const fileRepoMigratorInternal = createMigrator<FileRepo, FileRepo>();

export const defaultFileRepo = fileRepoMigratorInternal.createDefault({
  version: "1.0.0",
  projects: [
    {
      id: "main",
      name: "Default project",
      description: "The initial default project",
    },
  ],
  workflows: [],
});

export const fileRepoMigrations = fileRepoMigratorInternal.createMigrations({
  defaultValue: defaultFileRepo,
  migrations: [
    createMigration<FileRepo, never>({
      version: "1.0.0",
      up: finalVersion,
    }),
  ],
});
