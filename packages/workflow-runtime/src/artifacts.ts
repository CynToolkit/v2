import type { WorkflowArtifactInstanceCloud } from "./artifacts.types";

export type ArtifactKind = "project" | "application" | "files";

export interface ArtifactDescriptor {
  kind: ArtifactKind;
  technology?: string;
  platform?: string;
  architecture?: string;
  container: "file" | "directory" | "archive";
  format?: string;
  capabilities?: string[];
}

export interface WorkflowArtifactInstance {
  readonly id: string;
  readonly descriptor: ArtifactDescriptor;
  readonly version?: string;
  readonly path: string;
  readonly stepId: string;
  readonly artifact: string;
  readonly cloud?: WorkflowArtifactInstanceCloud;
  readonly checksum?: string;
  readonly size?: number;
  readonly [key: string]: unknown;
}

export type ArtifactInstance = WorkflowArtifactInstance;
