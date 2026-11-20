import type { ReleaseRetentionPolicy } from "@pipelab/shared";

export interface ApplyRetentionInput {
  projectId: string;
  workflowId: string;
  policy: ReleaseRetentionPolicy | undefined;
  keepId?: string;
}
