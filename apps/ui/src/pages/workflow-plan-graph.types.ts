import type { IconType } from "@pipelab/shared";

export interface PlanGraphEdgePoints {
  x: number;
  y: number;
}

export interface NodeCopyResult {
  label: string;
  detail?: string;
  icon?: IconType;
}
