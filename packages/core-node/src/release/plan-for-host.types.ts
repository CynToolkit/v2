import type { ReleaseConfig } from "@pipelab/shared";
import type { ReleasePlan } from "@pipelab/shared";

export interface PlanReleaseForHostResult {
  config: ReleaseConfig;
  plan: ReleasePlan;
}
