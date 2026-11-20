import type { MessageSchema } from "@pipelab/shared";
import type { SandboxFolder } from "@pipelab/constants";

export interface FolderPickerError {
  message: MessageSchema;
}

export interface GetFolderLabelFolder {
  name: SandboxFolder;
  label: string;
}
