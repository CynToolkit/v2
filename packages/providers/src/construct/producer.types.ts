import type { ConstructExportType } from "./export-types";
import type { ArtifactDescriptor } from "@pipelab/shared";
import type { Availability } from "@pipelab/shared";

export interface ConstructTargets {
  id: string;
  buildType: "web" | "desktop";
  exportType: ConstructExportType;
  output: ArtifactDescriptor;
  isAvailable: () => Availability;
}
