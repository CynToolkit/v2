import type { PreflightResult, RendererProviderMetadata } from "./plugins/definitions";
import {
  AuthError,
  AuthResponse,
  FunctionInvokeOptions,
  User,
  UserResponse,
} from "@supabase/supabase-js";
import { AppConfig, ConnectionsConfig } from "./config.schema";
import { FileRepo } from "./config/projects-definition";
import type {
  ReleaseCatalog,
  ReleaseConfig,
  ReleasePlan,
  ProducerInspection,
  ReleaseFieldOption,
  ReleaseProducerConfig,
  ValidationIssue,
} from "./release/types";
import { Agent } from "./websocket.types";
import {
  BuildHistoryEntry,
  BuildHistoryQuery,
  BuildHistoryResponse,
  BuildHistoryStorageInfo,
} from "./build-history";
import type {
  WorkflowConnectionOverride,
  WorkflowConnectionValues,
  WorkflowEvent,
  WorkflowResult,
} from "@pipelab/workflow-runtime";
export type BrowserProfileAuthStatus = "authenticated" | "not-authenticated" | "unknown";

export interface BrowserProfileCandidate {
  browser: string;
  profileName: string;
  path: string;
  isDefault: boolean;
  addonCount: number | null;
  authStatus: BrowserProfileAuthStatus;
  lastUpdatedAt: number | null;
  score: number | null;
  usable: boolean;
  reason?: string;
}

import type { EndEvent } from "./ipc.types";

export type ReleaseChannel = "stable" | "beta" | "dev";
export type IpcDefinition = {
  "fs:read": [
    // input
    { path: string },
    EndEvent<{ content: string }>,
  ];
  "fs:remove": [
    // input
    { path: string },
    EndEvent<boolean>,
  ];
  "fs:write": [
    // input
    {
      path: string;
      content: string;
    },
    EndEvent<{ ok: boolean }>,
  ];
  "fs:rm": [
    // input
    {
      path: string;
      recursive: boolean;
      force: boolean;
    },
    EndEvent<{ ok: boolean }>,
  ];
  "fs:listDirectory": [
    // input
    { path: string },
    EndEvent<{
      files: {
        name: string;
        isDirectory: boolean;
        isSymbolicLink: boolean;
        size: number;
        mtime: number;
      }[];
    }>,
  ];
  "fs:createDirectory": [{ path: string }, EndEvent<{ ok: boolean }>];
  "fs:getRoots": [void, EndEvent<{ roots: { name: string; path: string }[] }>];
  "fs:isPathBlacklisted": [{ path: string }, EndEvent<{ isBlacklisted: boolean }>];
  "fs:getHomeDirectory": [void, EndEvent<{ path: string }>];
  "shell:openPath": [{ path: string }, EndEvent<void>];
  "dialog:showOpenDialog": [
    // input
    Electron.OpenDialogOptions,
    EndEvent<{ canceled: boolean; filePaths: string[] }>,
  ];
  "dialog:showSaveDialog": [
    // input
    Electron.SaveDialogOptions,
    EndEvent<{ canceled: boolean; filePath: string | undefined }>,
  ];
  "providers:metadata:get": [void, EndEvent<{ providers: RendererProviderMetadata[] }>];

  "settings:load": [void, EndEvent<AppConfig>];
  "settings:save": [{ data: AppConfig }, EndEvent<"ok">];
  "settings:reset": [{ key: string }, EndEvent<"ok">];

  "connections:load": [void, EndEvent<ConnectionsConfig>];
  "connections:save": [{ data: ConnectionsConfig }, EndEvent<"ok">];
  "connections:reset": [{ key: string }, EndEvent<"ok">];
  "construct:profiles:discover": [
    { path?: string; forceRefresh?: boolean },
    EndEvent<BrowserProfileCandidate[]>,
  ];

  "projects:load": [void, EndEvent<FileRepo>];
  "projects:save": [{ data: FileRepo }, EndEvent<"ok">];
  "projects:reset": [{ key: string }, EndEvent<"ok">];

  "workflow:load": [{ workflowId: string; projectId?: string }, EndEvent<ReleaseConfig>];
  "release:catalog:get": [void, EndEvent<ReleaseCatalog>];
  "release:source:inspect": [
    { provider: string; config: Record<string, unknown> },
    EndEvent<{ issues?: ValidationIssue[]; fieldOptions?: Record<string, ReleaseFieldOption[]> }>,
  ];
  "release:producer:inspect": [
    { provider: string; config: ReleaseProducerConfig; sourceConfig?: Record<string, unknown> },
    EndEvent<ProducerInspection>,
  ];
  "release:validate": [{ config: ReleaseConfig }, EndEvent<{ issues: ValidationIssue[] }>];
  "release:plan": [{ config: ReleaseConfig }, EndEvent<ReleasePlan>];
  "release:resolve-defaults": [{ config: ReleaseConfig }, EndEvent<ReleaseConfig>];
  /** Read-only credential check for a connection; never throws, unsupported types are unverifiable. */
  "connection:test": [
    { pluginName: string; values: Record<string, string> },
    EndEvent<PreflightResult>,
  ];
  "workflow:save": [
    { workflowId: string; data: ReleaseConfig; projectId?: string },
    EndEvent<"ok">,
  ];
  "workflow:delete": [{ workflowId: string; projectId?: string }, EndEvent<"ok">];
  /** Applies the workflow's saved retention policy now; returns what was removed. */
  "workflow:retention:apply": [
    { workflowId: string; projectId?: string },
    EndEvent<{ runs: number; files: number }>,
  ];
  "workflow:execute": [
    {
      name: string;
      destinations?: string[];
      release?: { version: string; description: string };
      env?: Readonly<Record<string, string | undefined>>;
      connectionValues?: WorkflowConnectionValues;
      connectionOverrides?: readonly WorkflowConnectionOverride[];
      /** Run without checking destination accounts first. Same as the CLI's `--skip-preflight`. */
      skipPreflight?: boolean;
    },
    (
      | { type: "workflow-event"; data: WorkflowEvent }
      | { type: "workflow-run"; data: { runId: string } }
      | EndEvent<{ result: WorkflowResult; runId: string }>
    ),
  ];
  "workflow:cancel": [{ runId: string }, EndEvent<{ result: "ok" | "ko" }>];
  "pipelab-cloud:artifact-download-url": [{ hostedArtifactId: string }, EndEvent<{ url: string }>];

  // Build History APIs
  "build-history:save": [{ entry: BuildHistoryEntry }, EndEvent<{ result: "ok" | "ko" }>];
  "build-history:get": [
    { id: string; projectId?: string },
    EndEvent<{ entry?: BuildHistoryEntry }>,
  ];
  "build-history:get-all": [{ query?: BuildHistoryQuery }, EndEvent<BuildHistoryResponse>];
  "build-history:update": [
    { id: string; updates: Partial<BuildHistoryEntry>; projectId?: string },
    EndEvent<{ result: "ok" | "ko" }>,
  ];
  "build-history:delete": [{ id: string; projectId?: string }, EndEvent<{ result: "ok" | "ko" }>];
  "build-history:clear": [void, EndEvent<{ result: "ok" | "ko" }>];
  "build-history:clear-by-project": [{ projectId: string }, EndEvent<{ result: "ok" | "ko" }>];
  "build-history:get-storage-info": [void, EndEvent<BuildHistoryStorageInfo>];
  "agents:get": [void, EndEvent<{ agents: Agent[] }>];
  "auth:getUser": [void, EndEvent<{ user: User | null }>];
  "auth:getCloudAccessToken": [void, EndEvent<{ accessToken: string | null }>];
  "auth:signInWithPassword": [{ email: string; password: string }, EndEvent<UserResponse>];
  "auth:signUp": [{ email: string; password: string }, EndEvent<AuthResponse>];
  "auth:signOut": [void, EndEvent<void>];
  "auth:resetPasswordForEmail": [{ email: string }, EndEvent<{ error: AuthError | null }>];
  "auth:invoke": [
    { name: string; options?: FunctionInvokeOptions },
    EndEvent<{ data: unknown; error: { message?: string } | null }>,
  ];
  "agent:version:get": [void, EndEvent<{ version: string; channel: ReleaseChannel }>];
  "system:packages:cleanup": [void, EndEvent<boolean>];
  "startup:progress": [void, { type: "progress"; data: { message: string } } | { type: "done" }];
};

export type Channels = keyof IpcDefinition;

export const ShellChannels: Channels[] = [
  "dialog:showOpenDialog",
  "dialog:showSaveDialog",
  "shell:openPath",
];

export type Data<KEY extends Channels> = IpcDefinition[KEY][0];
export type Events<KEY extends Channels> = IpcDefinition[KEY][1];
export type End<KEY extends Channels> = Extract<IpcDefinition[KEY][1], { type: "end" }>["data"];

export type { RequestId } from "./ipc.types";
import type { RequestId } from "./ipc.types";

// type Output = End<'fs:openFolder'>
