import type { ReleaseConfig } from "@pipelab/shared";

export interface WorkflowLoadResultSuccess {
  type: "success";
  result: ReleaseConfig;
}

export interface WorkflowLoadResultError {
  type: "error";
  ipcError: string;
}

export interface LoadedWorkflow {
  content: ReleaseConfig;
}

export interface BrokenWorkflow {
  id: string;
  error: string;
}
