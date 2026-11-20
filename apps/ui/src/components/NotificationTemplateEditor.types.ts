import type { NotificationVariableInfo } from "../utils/notification-template";

export interface NotificationTemplateEditorProps {
  variables: NotificationVariableInfo[];
  defaultValue?: string;
  /** Longest message the channel accepts; longer text is cut when sent. */
  maxLength?: number;
}
