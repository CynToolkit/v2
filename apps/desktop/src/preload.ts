import { contextBridge, ipcRenderer } from "electron";
import { electronAPI, type ElectronAPI } from "@electron-toolkit/preload";
import type { PipelabBridge } from "@pipelab/shared";

declare global {
  interface Window {
    electron: ElectronAPI;
    pipelab: PipelabBridge;
    version: string;
    isPackaged: boolean;
  }
}

// No "workspace" pseudo-version: main always passes --app-version (dev included),
// so parse it unconditionally and fall back to 1.0.0 only if truly absent.
let version = "1.0.0";
try {
  const versionArg = process.argv.find((arg) => arg.startsWith("--app-version="));
  version = versionArg ? versionArg.split("=")[1] : "1.0.0";
} catch (error) {
  console.error("Failed to parse version in preload:", error);
}

// Custom APIs for renderer
// TODO: unify window and contextBridge

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
const versions = {
  electron: process.versions.electron,
  chrome: process.versions.chrome,
  node: process.versions.node,
  app: version,
};

const pipelab: PipelabBridge = {
  versions,
  showOpenDialog: (options) => ipcRenderer.invoke("dialog:showOpenDialog", options),
  showSaveDialog: (options) => ipcRenderer.invoke("dialog:showSaveDialog", options),
  openExternal: (url) => ipcRenderer.invoke("shell:openExternal", url),
  showItemInFolder: (path) => ipcRenderer.invoke("shell:showItemInFolder", path),
  openManagedFolder: (kind) => ipcRenderer.invoke("shell:openManagedFolder", kind),
  isPathBlacklisted: (path) => ipcRenderer.invoke("path:isBlacklisted", path),
  relaunch: () => ipcRenderer.invoke("app:relaunch"),
  installUpdate: () => ipcRenderer.invoke("app:install-update"),
  getUpdateChannel: () => ipcRenderer.invoke("app:update-channel:get"),
  findUpdateForChannel: (channel) => ipcRenderer.invoke("app:update-channel:find-update", channel),
  readWorkflowEnvironment: (workflowId) =>
    ipcRenderer.invoke("workflow:environment:read", workflowId),
};
const isPackaged = process.env.NODE_ENV !== "development";

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("pipelab", pipelab);
    contextBridge.exposeInMainWorld("version", version);
    contextBridge.exposeInMainWorld("isPackaged", isPackaged);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.pipelab = pipelab;
  window.version = version;
  window.isPackaged = isPackaged;
}
