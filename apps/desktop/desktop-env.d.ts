export {}; // Make this a module

declare global {
  type ElectronAPI = import("@electron-toolkit/preload").ElectronAPI;

  interface Window {
    version: string;
    electron: ElectronAPI;
    isPackaged: boolean;
    isTest: boolean;
    isCI: boolean;
  }

}
