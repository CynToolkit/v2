import type { WorkflowSaveState } from "../composables/workflow-document";
import type { ReleaseBuildProfileConfig } from "@pipelab/shared";

export interface HasUnsavedReleaseWorkflowStateInput {
  changeRevision: number;
  persistedRevision: number;
  saveState: WorkflowSaveState;
  buildSettingsOpen?: boolean;
  draftBuild?: ReleaseBuildProfileConfig;
  currentBuild?: ReleaseBuildProfileConfig;
}
