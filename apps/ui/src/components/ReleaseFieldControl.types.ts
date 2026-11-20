import type { ReleaseFieldDefinition } from "@pipelab/shared";
import type { ReleaseFieldOption } from "@pipelab/shared";
import type { ValidationIssue } from "@pipelab/shared";

export interface ReleaseFieldControlProps {
  field: ReleaseFieldDefinition;
  options: ReleaseFieldOption[];
  inputId: string;
  connectionBinding?: string;
  connectionBindingSuggestion?: ReleaseFieldOption;
  issues?: ValidationIssue[];
  allowPathEdit?: boolean;
  hideAdvanced?: boolean;
}

export interface ReleaseFieldControlEmits {
  "update:connection-binding": [connectionId: string];
  "add-connection": [integration: string];
}
