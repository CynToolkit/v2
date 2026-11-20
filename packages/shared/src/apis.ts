import type { PreflightResult } from "./plugins/definitions";
import type { AuthError, AuthResponse, UserResponse } from "@supabase/supabase-js";
import type { AppConfig, ConnectionsConfig } from "./config.schema";
import type { FileRepo } from "./config/projects-definition";
import type {
  ReleaseCatalog,
  ReleaseConfig,
  ReleasePlan,
  ProducerInspection,
  ReleaseFieldOption,
  ValidationIssue,
} from "./release/types";
import type { BuildHistoryResponse, BuildHistoryStorageInfo } from "./build-history";
export interface ReleaseSourceInspection {
  issues?: ValidationIssue[];
  fieldOptions?: Record<string, ReleaseFieldOption[]>;
}

export interface AuthErrorResult {
  error: AuthError | null;
}

export interface AuthInvokeError {
  message?: string;
}

export interface AuthInvokeResult {
  data: unknown;
  error: AuthInvokeError | null;
}

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
    FsReadInput,
    EndEvent<FsReadEvent>,
  ];
  "fs:remove": [
    // input
    FsReadInput,
    EndEvent<boolean>,
  ];
  "fs:write": [
    // input
    FsWriteInput,
    EndEvent<FsWriteEvent>,
  ];
  "fs:rm": [
    // input
    FsRmInput,
    EndEvent<FsWriteEvent>,
  ];
  "fs:listDirectory": [
    // input
    FsReadInput,
    EndEvent<FsListDirectoryEvent>,
  ];
  "fs:createDirectory": [FsReadInput, EndEvent<FsWriteEvent>];
  "fs:getRoots": [void, EndEvent<FsGetRootsEvent>];
  "fs:isPathBlacklisted": [FsReadInput, EndEvent<FsIsPathBlacklistedEvent>];
  "fs:getHomeDirectory": [void, EndEvent<FsReadInput>];
  "shell:openPath": [FsReadInput, EndEvent<void>];
  "dialog:showOpenDialog": [
    // input
    Electron.OpenDialogOptions,
    EndEvent<OpenDialogResult>,
  ];
  "dialog:showSaveDialog": [
    // input
    Electron.SaveDialogOptions,
    EndEvent<SaveDialogResult>,
  ];
  "providers:metadata:get": [void, EndEvent<ProvidersMetadataGetEvent>];

  "settings:load": [void, EndEvent<AppConfig>];
  "settings:save": [SettingsSaveInput, EndEvent<"ok">];
  "settings:reset": [SettingsResetInput, EndEvent<"ok">];

  "connections:load": [void, EndEvent<ConnectionsConfig>];
  "connections:save": [ConnectionsSaveInput, EndEvent<"ok">];
  "connections:reset": [SettingsResetInput, EndEvent<"ok">];
  "construct:profiles:discover": [
    ConstructProfilesDiscoverInput,
    EndEvent<BrowserProfileCandidate[]>,
  ];

  "projects:load": [void, EndEvent<FileRepo>];
  "projects:save": [ProjectsSaveInput, EndEvent<"ok">];
  "projects:reset": [SettingsResetInput, EndEvent<"ok">];

  "workflow:load": [WorkflowLoadInput, EndEvent<ReleaseConfig>];
  "release:catalog:get": [void, EndEvent<ReleaseCatalog>];
  "release:source:inspect": [ReleaseSourceInspectInput, EndEvent<ReleaseSourceInspection>];
  "release:producer:inspect": [ReleaseProducerInspectInput, EndEvent<ProducerInspection>];
  "release:validate": [ReleaseValidateInput, EndEvent<ReleaseValidateEvent>];
  "release:plan": [ReleaseValidateInput, EndEvent<ReleasePlan>];
  "release:resolve-defaults": [ReleaseValidateInput, EndEvent<ReleaseConfig>];
  /** Read-only credential check for a connection; never throws, unsupported types are unverifiable. */
  "connection:test": [ConnectionTestInput, EndEvent<PreflightResult>];
  "workflow:save": [WorkflowSaveInput, EndEvent<"ok">];
  "workflow:delete": [WorkflowLoadInput, EndEvent<"ok">];
  /** Applies the workflow's saved retention policy now; returns what was removed. */
  "workflow:retention:apply": [WorkflowLoadInput, EndEvent<WorkflowRetentionApplyEvent>];
  "workflow:execute": [
    WorkflowExecuteInput,
    (
      | WorkflowExecuteEventWorkflowEvent
      | WorkflowExecuteEventWorkflowRun
      | EndEvent<WorkflowExecuteEvent>
    ),
  ];
  "workflow:cancel": [WorkflowExecuteEventWorkflowRunData, EndEvent<WorkflowCancelEvent>];
  "pipelab-cloud:artifact-download-url": [
    PipelabCloudArtifactDownloadUrlInput,
    EndEvent<PipelabCloudArtifactDownloadUrlEvent>,
  ];

  // Build History APIs
  "build-history:save": [BuildHistorySaveInput, EndEvent<WorkflowCancelEvent>];
  "build-history:get": [BuildHistoryGetInput, EndEvent<BuildHistoryGetEvent>];
  "build-history:get-all": [BuildHistoryGetAllInput, EndEvent<BuildHistoryResponse>];
  "build-history:update": [BuildHistoryUpdateInput, EndEvent<WorkflowCancelEvent>];
  "build-history:delete": [BuildHistoryGetInput, EndEvent<WorkflowCancelEvent>];
  "build-history:clear": [void, EndEvent<WorkflowCancelEvent>];
  "build-history:clear-by-project": [
    BuildHistoryClearByProjectInput,
    EndEvent<WorkflowCancelEvent>,
  ];
  "build-history:get-storage-info": [void, EndEvent<BuildHistoryStorageInfo>];
  "agents:get": [void, EndEvent<AgentsGetEvent>];
  "auth:getUser": [void, EndEvent<AuthGetUserEvent>];
  "auth:getCloudAccessToken": [void, EndEvent<AuthGetCloudAccessTokenEvent>];
  "auth:signInWithPassword": [AuthSignInWithPasswordInput, EndEvent<UserResponse>];
  "auth:signUp": [AuthSignInWithPasswordInput, EndEvent<AuthResponse>];
  "auth:signOut": [void, EndEvent<void>];
  "auth:resetPasswordForEmail": [AuthResetPasswordForEmailInput, EndEvent<AuthErrorResult>];
  "auth:invoke": [AuthInvokeInput, EndEvent<AuthInvokeResult>];
  "agent:version:get": [void, EndEvent<AgentVersionGetEvent>];
  "system:packages:cleanup": [void, EndEvent<boolean>];
  "startup:progress": [void, StartupProgressEventProgress | StartupProgressEventDone];
};

export type Channels = keyof IpcDefinition;

/** Channels the Electron shell can answer natively instead of the agent. */
export type ShellChannel = "dialog:showOpenDialog" | "dialog:showSaveDialog" | "shell:openPath";

export type Data<KEY extends Channels> = IpcDefinition[KEY][0];
export type Events<KEY extends Channels> = IpcDefinition[KEY][1];
export type End<KEY extends Channels> = Extract<IpcDefinition[KEY][1], EndEventShape>["data"];

export type { RequestId } from "./ipc.types";
export type { ConnectionTestInput, FsDirectoryEntry, FsRoot } from "./apis.types";
import type { RequestId } from "./ipc.types";
import type {
  FsReadInput,
  FsReadEvent,
  FsWriteInput,
  FsWriteEvent,
  FsRmInput,
  FsListDirectoryEvent,
  FsGetRootsEvent,
  FsIsPathBlacklistedEvent,
  ProvidersMetadataGetEvent,
  SettingsSaveInput,
  SettingsResetInput,
  ConnectionsSaveInput,
  ConstructProfilesDiscoverInput,
  ProjectsSaveInput,
  WorkflowLoadInput,
  ReleaseSourceInspectInput,
  ReleaseProducerInspectInput,
  ReleaseValidateInput,
  ReleaseValidateEvent,
  ConnectionTestInput,
  WorkflowSaveInput,
  WorkflowRetentionApplyEvent,
  WorkflowExecuteInput,
  WorkflowExecuteEventWorkflowEvent,
  WorkflowExecuteEventWorkflowRunData,
  WorkflowExecuteEventWorkflowRun,
  WorkflowExecuteEvent,
  WorkflowCancelEvent,
  PipelabCloudArtifactDownloadUrlInput,
  PipelabCloudArtifactDownloadUrlEvent,
  BuildHistorySaveInput,
  BuildHistoryGetInput,
  BuildHistoryGetEvent,
  BuildHistoryGetAllInput,
  BuildHistoryUpdateInput,
  BuildHistoryClearByProjectInput,
  AgentsGetEvent,
  AuthGetUserEvent,
  AuthGetCloudAccessTokenEvent,
  AuthSignInWithPasswordInput,
  AuthResetPasswordForEmailInput,
  AuthInvokeInput,
  AgentVersionGetEvent,
  StartupProgressEventProgress,
  StartupProgressEventDone,
  EndEventShape,
} from "./apis.types";
import type { OpenDialogResult } from "./preload.types";
import type { SaveDialogResult } from "./preload.types";

// type Output = End<'fs:openFolder'>
