import type { IpcMain, IpcMainInvokeEvent } from "electron";
import { isTrustedRendererUrl } from "./trusted-origin";

/**
 * Wraps `ipcMain` so every handler only runs for calls made by a frame of the
 * app's own renderer origin. Any other frame (for example an embedded or
 * navigated-away page) is rejected before the handler can touch the system.
 */
export const guardedIpcMain = (
  ipcMain: Pick<IpcMain, "handle" | "removeHandler">,
  getTrustedOrigins: () => readonly string[],
): Pick<IpcMain, "handle" | "removeHandler"> => ({
  removeHandler: (channel) => ipcMain.removeHandler(channel),
  handle: (channel, listener) =>
    ipcMain.handle(channel, (event: IpcMainInvokeEvent, ...args: unknown[]) => {
      const url = event.senderFrame?.url;
      if (!isTrustedRendererUrl(url, getTrustedOrigins())) {
        throw new Error(`Blocked IPC call "${channel}" from untrusted origin`);
      }
      return listener(event, ...args);
    }),
});
