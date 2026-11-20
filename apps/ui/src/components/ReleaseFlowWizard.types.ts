import type { ReleaseConfig } from "@pipelab/shared";

export interface ReleaseFlowWizardProps {
  visible: boolean;
  projectId?: string;
}

export interface ReleaseFlowWizardEmits {
  "update:visible": [value: boolean];
  create: [flow: ReleaseConfig];
}
