import type { IconType } from "@pipelab/shared";

export interface ServiceIconProps {
  icon?: IconType;
  fallback?: string;
  size?: "sm" | "md" | "lg";
}
