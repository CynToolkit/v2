import type { PipelabSelectOption } from "./definitions";

export interface ControlTypeInputOptions {
  kind: "number" | "text";
  validator?: string;
  placeholder?: string;
  password?: boolean;
}

export interface ControlTypeSelectOptions {
  options: Array<PipelabSelectOption>;
  placeholder: string;
}

export interface ControlTypeArrayOptions {
  kind: "number" | "text";
}

export interface IconTypeImage {
  type: "image";
  /**
   * base64 image
   */
  image: string;
}

export interface IconTypeIcon {
  type: "icon";
  icon: string;
}

export interface PreflightResultVerified {
  status: "verified";
}

export interface PreflightResultUnverifiable {
  status: "unverifiable";
  reason: string;
}

export interface PreflightResultFailed {
  status: "failed";
  message: string;
}

export interface MainPluginDefinitionValidators {
  id: string;
  description: string;
  validator: (options: Record<string, unknown>) => unknown;
}
