import type { WorkflowValueResolver } from "@pipelab/workflow-runtime";
import type { ProviderServices } from "../workflow-tasks";

export interface RunPreflightsInput {
  valueResolver: WorkflowValueResolver;
  services: ProviderServices;
  signal?: AbortSignal;
}
