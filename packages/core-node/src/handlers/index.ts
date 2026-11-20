import { registerShellHandlers } from "./shell";
import { registerFsHandlers } from "./fs";
import { registerConfigHandlers } from "./config";
import { registerHistoryHandlers } from "./history";
import { registerEngineHandlers } from "./engine";
import { registerAgentsHandlers } from "./agents";
import { registerAuthHandlers } from "./auth";
import { registerSystemHandlers } from "./system";
import { registerWorkflowHandlers } from "./workflow";
import { BuildHistoryStorage } from "./build-history";
import { sweepRetention } from "../release/apply-retention";
import type { RegisterAllHandlersOptions } from "./index.types";

export const registerAllHandlers = async (options: RegisterAllHandlersOptions) => {
  const context = options.context;
  await new BuildHistoryStorage(context).reconcileInterruptedRuns();

  registerShellHandlers(context);
  registerFsHandlers(context);
  registerConfigHandlers(context);
  registerHistoryHandlers(context);
  registerEngineHandlers(context);
  registerWorkflowHandlers(context);
  registerAgentsHandlers(context);
  registerAuthHandlers(context);
  registerSystemHandlers(options);

  // Background, once per start: age-based rules also move for workflows that are never run.
  void sweepRetention(context);
};

export { registerShellHandlers } from "./shell";
export { registerFsHandlers } from "./fs";
export { registerConfigHandlers } from "./config";
export { registerHistoryHandlers } from "./history";
export { registerEngineHandlers } from "./engine";
export { registerAgentsHandlers } from "./agents";
export { BuildHistoryStorage } from "./build-history";
export {
  cancelAllWorkflowRuns,
  executeWorkflow,
  prepareReleaseWorkflow,
  registerWorkflowHandlers,
} from "./workflow";
export type { ExecuteWorkflowOptions } from "./workflow";
