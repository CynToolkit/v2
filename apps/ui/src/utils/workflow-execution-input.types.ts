import type { Data } from "@pipelab/shared";

export interface DesktopWorkflowExecutionInput<Result> {
  request: Data<"workflow:execute">;
  readEnvironment: () => Promise<Readonly<Record<string, string | undefined>>>;
  execute: (request: Data<"workflow:execute">) => Promise<Result>;
}
