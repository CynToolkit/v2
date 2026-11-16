import type { Data } from "@pipelab/shared";
import type { ExecuteWorkflowOptions } from "@pipelab/core-node";

/** Classify every IPC execution input so new UI inputs trigger review and a parity test. */
export const executionInputPolicy = {
  name: "shared workflow identifier",
  destinations: "legacy IPC input; the shared engine plans destinations from saved config",
  release: "UI-specific release metadata; CLI currently uses engine defaults",
  env: "UI forwards its initiating environment; CLI uses its process environment",
  connectionValues: "UI identity-backed connections; CLI has no implicit account identity",
  connectionOverrides: "shared run-scoped overrides; CLI exposes --connection",
  skipPreflight: "shared preflight policy; CLI exposes --skip-preflight",
} satisfies Record<keyof Data<"workflow:execute">, string>;

/** Classify every engine input so new execution policy must be considered across both hosts. */
export const engineExecutionOptionPolicy = {
  release: "UI release metadata; CLI currently uses the engine defaults",
  workflowConfig: "CLI portable-file input; UI loads the saved workflow in the engine",
  env: "UI initiating environment versus CLI process environment",
  connectionValues: "UI identity-backed connection values; CLI has no implicit account identity",
  connectionOverrides: "shared run-scoped override behavior",
  persist: "CLI-only temporary-run option; UI persists runs",
  signal: "UI cancellation transport; CLI terminal cancellation is not exposed here",
  onEvent: "host-specific event presentation over shared runtime events",
  onRunCreated: "UI run ID transport; CLI uses the returned run ID",
  logger: "host-specific logging over shared workflow diagnostics",
  skipPreflight: "shared preflight behavior; CLI exposes --skip-preflight",
} satisfies Record<keyof ExecuteWorkflowOptions, string>;
