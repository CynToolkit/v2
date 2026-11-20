import type { SandboxFolder } from "@pipelab/constants";

export interface GetSandboxFoldersResult {
  name: SandboxFolder;
  label: string;
  path: string;
}

export interface FoldersRecordEntry {
  label: string;
  path: string;
}
