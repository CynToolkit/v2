import type { ReleaseConfig } from "@pipelab/shared";
import type { ReleaseCatalog } from "@pipelab/shared";
import type { CompatibleBuildCandidate } from "../pages/release-flow-model";

export interface NewBuildDialogProps {
  visible: boolean;
  flow?: ReleaseConfig;
  catalog: ReleaseCatalog;
  destinationId?: string;
  slotId?: string;
}

export interface NewBuildDialogEmits {
  "update:visible": [value: boolean];
  create: [choice: CompatibleBuildCandidate];
}

export interface SearchInput {
  $el?: HTMLElement;
}
