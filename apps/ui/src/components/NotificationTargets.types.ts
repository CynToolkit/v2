import type { ReleaseConfig } from "@pipelab/shared";
import type { ReleaseCatalog } from "@pipelab/shared";
import type { ReleaseNotificationConfig } from "@pipelab/shared";
import type { ReleaseFieldDefinition } from "@pipelab/shared";

export interface NotificationTargetsProps {
  flow: ReleaseConfig;
  catalog: ReleaseCatalog;
  projectId?: string;
}

export interface PendingNotificationTarget {
  target: ReleaseNotificationConfig;
  field: ReleaseFieldDefinition;
}
