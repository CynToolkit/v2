import type { ConstructExportType } from "./assets/script";
import type { ArtifactDescriptor } from "@pipelab/shared";
import type { Availability } from "@pipelab/shared";

export interface ConstructTargets {
  id: string;
  buildType: "web" | "desktop";
  exportType: ConstructExportType;
  output: ArtifactDescriptor;
  isAvailable: () => Availability;
}
