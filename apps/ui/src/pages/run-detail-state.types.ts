import type { BuildHistoryEntry } from "@pipelab/shared";

export interface WorkflowArtifactsArtifacts {
  type: "workflow.completed";
}

export interface RunLogGroups {
  current: BuildHistoryEntry["logs"];
  persisted: BuildHistoryEntry["logs"];
}

interface WorkflowCancellationFeedbackFallback {
  result?: string;
}

export interface WorkflowCancellationFeedbackResult {
  type: string;
  result?: WorkflowCancellationFeedbackFallback;
}

export interface FailureFixStep {
  destinationId?: string;
  slotId?: string;
  destinationName?: string;
  uses?: string;
}
