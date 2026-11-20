import type { ReleaseRetentionPolicy } from "./types";

export interface PlanRetentionInput {
  workflowId: string;
  keepId: string;
  policy: ReleaseRetentionPolicy | undefined;
  now?: number;
}
