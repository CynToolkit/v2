import type { IconType } from "@pipelab/shared";
import type { ReleaseNotificationConfig } from "@pipelab/shared";

interface NotificationTriggerPickerPropsDestinations {
  id: string;
  label: string;
  icon?: IconType;
}

export interface NotificationTriggerPickerProps {
  target: ReleaseNotificationConfig;
  destinations: Array<NotificationTriggerPickerPropsDestinations>;
}
