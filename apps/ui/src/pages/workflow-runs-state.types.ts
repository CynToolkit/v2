import type { BuildHistoryEntry } from "@pipelab/shared";

export interface IsWorkflowRouteContextValidWorkflow {
  id?: string;
  project?: string;
}

export interface ResolveWorkflowRunsStateHistory {
  entries: BuildHistoryEntry[];
}

export interface ResolveWorkflowRunsStateWorkflow {
  id: string;
  project: string;
  name?: string;
}
