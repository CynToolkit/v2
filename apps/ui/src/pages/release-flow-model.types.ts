import type { releaseReadinessState } from "./release-flow-model";

export interface ReleaseOutputOwnerRefSource {
  source: true;
}

export interface ReleaseOutputOwnerRefBuild {
  buildId: string;
}

export interface OutputReferenceChangeActionSourceProvider {
  kind: "source-provider";
  oldProvider: string;
  newProvider: string;
}

export interface OutputReferenceChangeActionBuildRemove {
  kind: "build-remove";
  buildName: string;
}

export interface DashboardShipIntentActionOptions {
  intent: boolean;
  workflowMatchesRoute: boolean;
  loading: boolean;
  readiness: ReturnType<typeof releaseReadinessState>;
  canShip: boolean;
}

export interface ApplyProducerInspectionOptions {
  applyFieldValues?: boolean;
}
