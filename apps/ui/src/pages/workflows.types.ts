import type { ReleaseConfig } from "@pipelab/shared";

export interface WorkflowsEnhanced {
  id: string;
  project: string;
  lastModified: string;
  content: ReleaseConfig;
}
