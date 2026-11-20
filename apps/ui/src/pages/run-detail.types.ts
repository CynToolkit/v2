import type { BuildHistoryEntry } from "@pipelab/shared";

export interface FailureDiagnosticRef {
  stepId?: string;
  title: string;
}

export interface SkippableStep {
  status: string;
  blockedBy?: string[];
}

export interface PhaseToggleStep {
  id: string;
  status: string;
}

export interface DeliveryGroup {
  id: string;
  serviceId: string;
  name: string;
  items: NonNullable<BuildHistoryEntry["deliveries"]>;
}
