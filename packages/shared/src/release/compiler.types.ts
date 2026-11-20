import type { WorkflowStep } from "@pipelab/workflow-runtime";
import type { CompiledArtifact } from "./types";

export interface ProviderRef {
  id: string;
}

export interface IsSourceRefResult {
  source: true;
}

interface CompileErrorsPlanIssues {
  severity: string;
  message: string;
}

export interface CompileErrorsPlan {
  issues: Array<CompileErrorsPlanIssues>;
}

export interface CompileBeforeBuildHooksResult {
  steps: WorkflowStep[];
  artifact: CompiledArtifact;
}
