import type { RendererProviderMetadata } from "./plugins/definitions";
import type { AppConfig } from "./config.schema";
import type { ConnectionsConfig } from "./config.schema";
import type { FileRepo } from "./config/projects-definition";
import type { ReleaseProducerConfig } from "./release/types";
import type { ReleaseConfig } from "./release/types";
import type { ValidationIssue } from "./release/types";
import type { WorkflowConnectionValues } from "@pipelab/workflow-runtime";
import type { WorkflowConnectionOverride } from "@pipelab/workflow-runtime";
import type { WorkflowEvent } from "@pipelab/workflow-runtime";
import type { WorkflowResult } from "@pipelab/workflow-runtime";
import type { BuildHistoryEntry } from "./build-history";
import type { BuildHistoryQuery } from "./build-history";
import type { Agent } from "./websocket.types";
import type { User } from "@supabase/supabase-js";
import type { FunctionInvokeOptions } from "@supabase/supabase-js";
import type { ReleaseChannel } from "./apis";

export interface FsReadInput {
  path: string;
}

export interface FsReadEvent {
  content: string;
}

export interface FsWriteInput {
  path: string;
  content: string;
}

export interface FsWriteEvent {
  ok: boolean;
}

export interface FsRmInput {
  path: string;
  recursive: boolean;
  force: boolean;
}

export interface FsDirectoryEntry {
  name: string;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  size: number;
  mtime: number;
}

export interface FsListDirectoryEvent {
  files: FsDirectoryEntry[];
}

export interface FsRoot {
  name: string;
  path: string;
}

export interface FsGetRootsEvent {
  roots: FsRoot[];
}

export interface FsIsPathBlacklistedEvent {
  isBlacklisted: boolean;
}

export interface ProvidersMetadataGetEvent {
  providers: RendererProviderMetadata[];
}

export interface SettingsSaveInput {
  data: AppConfig;
}

export interface SettingsResetInput {
  key: string;
}

export interface ConnectionsSaveInput {
  data: ConnectionsConfig;
}

export interface ConstructProfilesDiscoverInput {
  path?: string;
  forceRefresh?: boolean;
}

export interface ProjectsSaveInput {
  data: FileRepo;
}

export interface WorkflowLoadInput {
  workflowId: string;
  projectId?: string;
}

export interface ReleaseSourceInspectInput {
  provider: string;
  config: Record<string, unknown>;
}

export interface ReleaseProducerInspectInput {
  provider: string;
  config: ReleaseProducerConfig;
  sourceConfig?: Record<string, unknown>;
}

export interface ReleaseValidateInput {
  config: ReleaseConfig;
}

export interface ReleaseValidateEvent {
  issues: ValidationIssue[];
}

export interface ConnectionTestInput {
  pluginName: string;
  values: Record<string, string>;
}

export interface WorkflowSaveInput {
  workflowId: string;
  data: ReleaseConfig;
  projectId?: string;
}

export interface WorkflowRetentionApplyEvent {
  runs: number;
  files: number;
}

interface WorkflowExecuteInputRelease {
  version: string;
  description: string;
}

export interface WorkflowExecuteInput {
  name: string;
  destinations?: string[];
  release?: WorkflowExecuteInputRelease;
  env?: Readonly<Record<string, string | undefined>>;
  connectionValues?: WorkflowConnectionValues;
  connectionOverrides?: readonly WorkflowConnectionOverride[];
  /** Run without checking destination accounts first. Same as the CLI's `--skip-preflight`. */
  skipPreflight?: boolean;
}

export interface WorkflowExecuteEventWorkflowEvent {
  type: "workflow-event";
  data: WorkflowEvent;
}

export interface WorkflowExecuteEventWorkflowRunData {
  runId: string;
}

export interface WorkflowExecuteEventWorkflowRun {
  type: "workflow-run";
  data: WorkflowExecuteEventWorkflowRunData;
}

export interface WorkflowExecuteEvent {
  result: WorkflowResult;
  runId: string;
}

export interface WorkflowCancelEvent {
  result: "ok" | "ko";
}

export interface PipelabCloudArtifactDownloadUrlInput {
  hostedArtifactId: string;
}

export interface PipelabCloudArtifactDownloadUrlEvent {
  url: string;
}

export interface BuildHistorySaveInput {
  entry: BuildHistoryEntry;
}

export interface BuildHistoryGetInput {
  id: string;
  projectId?: string;
}

export interface BuildHistoryGetEvent {
  entry?: BuildHistoryEntry;
}

export interface BuildHistoryGetAllInput {
  query?: BuildHistoryQuery;
}

export interface BuildHistoryUpdateInput {
  id: string;
  updates: Partial<BuildHistoryEntry>;
  projectId?: string;
}

export interface BuildHistoryClearByProjectInput {
  projectId: string;
}

export interface AgentsGetEvent {
  agents: Agent[];
}

export interface AuthGetUserEvent {
  user: User | null;
}

export interface AuthGetCloudAccessTokenEvent {
  accessToken: string | null;
}

export interface AuthSignInWithPasswordInput {
  email: string;
  password: string;
}

export interface AuthResetPasswordForEmailInput {
  email: string;
}

export interface AuthInvokeInput {
  name: string;
  options?: FunctionInvokeOptions;
}

export interface AgentVersionGetEvent {
  version: string;
  channel: ReleaseChannel;
}

interface StartupProgressEventProgressData {
  message: string;
}

export interface StartupProgressEventProgress {
  type: "progress";
  data: StartupProgressEventProgressData;
}

export interface StartupProgressEventDone {
  type: "done";
}

export interface EndEventShape {
  type: "end";
}
