import type { InitialDataFailure, InitialDataSection } from "./initial-data-state";

export interface InitialDataResultSuccess {
  type: "success";
}

export interface InitialDataResultError {
  type: "error";
  failure: InitialDataFailure;
}

export interface LoadInitialDataSteps {
  section: InitialDataSection;
  load: () => Promise<unknown>;
}
