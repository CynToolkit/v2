// 1. Config migrators
export {
  appSettingsMigrator,
  defaultAppSettings,
  fileRepoMigrations,
  defaultFileRepo,
  configRegistry,
  connectionsMigrator,
  defaultConnections,
} from "./config/migrators";

// 2. Types
export type { Migrator } from "./config/migrators";
export type { IpcDefinition } from "./apis";
export type { IpcDefinition as RendererIpcDefinition } from "./ipc.types";
export type { RequestId } from "./apis";
export type { RequestId as RendererRequestId } from "./ipc.types";

// 3. Core Library exports (Systematic restoration)
export * from "./apis";
export * from "./build-history";
export * from "./release/descriptor";
export * from "./release/deployment-folder";
export * from "./config.schema";
export * from "./database.types";
export * from "./fmt";
export * from "./i18n-utils";
export * from "./ipc.types";
export * from "./logger";
export * from "./plugins/definitions";
export * from "./quickjs";
export * from "./supabase";
export * from "./types";
export * from "./utils";
export * from "./validation";
export * from "./variables";
export * from "./websocket.types";
export * from "./persisted-id";
export * from "./release/types";
export * from "./release/matcher";
export * from "./release/config";
export * from "./release/catalog";
export * from "./release/compiler";
export * from "./release/validate";
export * from "./release/usage";
export * from "./release/notification";
export * from "./release/planner";
export * from "./release/preferences";
export * from "./release/defaults";
export * from "./release/host-availability";
export * from "./release/retention";

// 4. Configuration Sub-packages
export * from "./config/projects-definition";
export * from "./config/connections-definition";

// NOTE: We avoid "export * from './config'" to prevent nested re-export circles.
// All necessary members from the config subfolder are explicitly exported above.
