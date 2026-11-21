import type { ReleaseChannel } from "./apis";

export type UpdateChannel = Exclude<ReleaseChannel, "dev">;

export interface AvailableUpdate {
  version: string;
  downloadUrl: string;
}

export interface PipelabVersions {
  electron?: string;
  chrome?: string;
  node?: string;
  app?: string;
}

export interface OpenDialogResult {
  canceled: boolean;
  filePaths: string[];
}

export interface SaveDialogResult {
  canceled: boolean;
  filePath: string | undefined;
}

/** Methods the Desktop preload exposes to the renderer as `window.pipelab`. */
export interface PipelabBridge {
  versions: PipelabVersions;
  showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<OpenDialogResult>;
  showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<SaveDialogResult>;
  openExternal: (url: string) => Promise<boolean | void>;
  showItemInFolder: (path: string) => Promise<unknown>;
  isPathBlacklisted: (path: string) => Promise<boolean>;
  relaunch: () => Promise<void>;
  installUpdate: () => Promise<void>;
  getUpdateChannel: () => Promise<UpdateChannel>;
  findUpdateForChannel: (channel: UpdateChannel) => Promise<AvailableUpdate | null>;
  readWorkflowEnvironment: (workflowId: string) => Promise<Record<string, string>>;
}
