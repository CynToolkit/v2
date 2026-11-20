import type {
  InitialDataResultSuccess,
  InitialDataResultError,
  LoadInitialDataSteps,
} from "./initial-data-state.types";

export type InitialDataSection =
  | "projects"
  | "providers"
  | "settings"
  | "connections"
  | "auth"
  | "subscription";

type InitialDataFailureKind = "backend-disconnected" | "project-config" | "connections" | "other";

export interface InitialDataFailure {
  kind: InitialDataFailureKind;
  message: string;
}

export type InitialDataResult = InitialDataResultSuccess | InitialDataResultError;

export const loadInitialData = async (
  steps: Array<LoadInitialDataSteps>,
  isBackendConnected: () => boolean,
): Promise<InitialDataResult> => {
  for (const step of steps) {
    try {
      await step.load();
    } catch (error) {
      const kind: InitialDataFailureKind = !isBackendConnected()
        ? "backend-disconnected"
        : step.section === "projects" || step.section === "settings"
          ? "project-config"
          : step.section === "connections"
            ? "connections"
            : "other";
      return {
        type: "error",
        failure: {
          kind,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
  return { type: "success" };
};
