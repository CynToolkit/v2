/** Methods the Desktop preload exposes to the renderer as `window.pipelab`. */
export interface PipelabBridge {
  versions: {
    electron?: string;
    chrome?: string;
    node?: string;
    app?: string;
  };
  showOpenDialog: (
    options: Electron.OpenDialogOptions,
  ) => Promise<{ canceled: boolean; filePaths: string[] }>;
  showSaveDialog: (
    options: Electron.SaveDialogOptions,
  ) => Promise<{ canceled: boolean; filePath: string | undefined }>;
  openExternal: (url: string) => Promise<boolean | void>;
  showItemInFolder: (path: string) => Promise<unknown>;
  isPathBlacklisted: (path: string) => Promise<boolean>;
  relaunch: () => Promise<void>;
  installUpdate: () => Promise<void>;
  readWorkflowEnvironment: (workflowId: string) => Promise<Record<string, string>>;
}
