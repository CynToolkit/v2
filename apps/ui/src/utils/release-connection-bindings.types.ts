import type { ReleaseConfig, ReleaseFieldDefinition } from "@pipelab/shared";
import type { WorkflowConnectionBinding } from "@pipelab/shared";
import type { ReleaseBuildProfileConfig } from "@pipelab/shared";

export interface ConnectionDraftMatchesIntegrationDraft {
  integration: string;
  integrationName: string;
}

export interface RenameWorkflowConnectionAliasResult {
  config: ReleaseConfig;
  workflowBindings: WorkflowConnectionBinding[];
}

export interface RenameWorkflowConnectionAliasWithDraftResult {
  config: ReleaseConfig;
  draftBuild?: ReleaseBuildProfileConfig;
  workflowBindings: WorkflowConnectionBinding[];
}

export interface PersistWorkflowConnectionAliasRenameInput {
  workflowId: string;
  previousAlias: string;
  previousBindings: WorkflowConnectionBinding[];
  nextBindings: WorkflowConnectionBinding[];
  saveConnections: (bindings: WorkflowConnectionBinding[]) => Promise<void>;
  saveWorkflow: () => Promise<void>;
}

export interface ConnectionDraft {
  name: string;
  integration: string;
  integrationName: string;
  values: Record<string, string>;
}

export interface PendingFieldConnection {
  config: Record<string, unknown>;
  field: ReleaseFieldDefinition;
}
