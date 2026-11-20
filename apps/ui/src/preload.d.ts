import type { ElectronAPI } from "@electron-toolkit/preload";
import type { PipelabBridge } from "@pipelab/shared";

declare global {
  interface Window {
    electron: ElectronAPI;
    version?: string;
    isPackaged?: boolean;
    isTest?: boolean;
    isCI?: boolean;
    pipelab?: PipelabBridge;
  }
}
export {}; // Make this a module
