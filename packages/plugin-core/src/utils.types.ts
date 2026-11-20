import type { Subprocess } from "execa";

export interface DownloadProgress {
  progress: number;
  downloadedSize: number;
}

export interface RunWithLiveLogsHooks {
  onStdout?: (data: string, subprocess: Subprocess) => void;
  onStderr?: (data: string, subprocess: Subprocess) => void;
  onExit?: (code: number) => void;
  onCreated?: (subprocess: Subprocess) => void;
}
