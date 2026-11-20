import { Channels, Data, End, Events, ShellChannels } from "@pipelab/shared";
import { useLogger } from "@pipelab/shared";
import { useWebSocketAPI } from "./websocket-client";
import { WebSocketListener } from "@pipelab/shared";
import { useUIStore, type FilePickerOptions } from "../store/ui";

// Re-export for backwards compatibility
export type { WebSocketListener };

export const useAPI = () => {
  const { logger } = useLogger();
  const { execute: wsExecute, isConnected, on: wsOn } = useWebSocketAPI();
  const uiStore = useUIStore();

  /**
   * Send an order and wait for its execution
   */
  const execute = async <KEY extends Channels>(
    channel: KEY,
    data?: Data<KEY>,
    listener?: WebSocketListener<KEY>,
  ): Promise<End<KEY>> => {
    // If it's a shell channel and we are in Electron, use IPC
    if (ShellChannels.includes(channel)) {
      if (window.electron) {
        logger().debug("Routing to Electron IPC:", channel);
        try {
          // Vue reactive values cannot cross Electron's structured-clone IPC boundary.
          const ipcData = data === undefined ? undefined : JSON.parse(JSON.stringify(data));
          const result = await window.electron.ipcRenderer.invoke(channel, ipcData);
          return {
            type: "success",
            result,
          } as End<KEY>;
        } catch (error) {
          logger().error("Shell channel IPC invoke error:", error);
          return {
            type: "error",
            ipcError: error instanceof Error ? error.message : String(error),
          } as End<KEY>;
        }
      } else {
        // Fallback for headless mode
        if (channel === "dialog:showOpenDialog") {
          logger().debug("Falling back to web file picker (open):", data);
          const result = await uiStore.showFilePicker({
            ...(data as Partial<FilePickerOptions>),
            mode: "open",
          });
          return {
            type: "success",
            result,
          } as End<KEY>;
        } else if (channel === "dialog:showSaveDialog") {
          logger().debug("Falling back to web file picker (save):", data);
          const result = await uiStore.showFilePicker({
            ...(data as Partial<FilePickerOptions>),
            mode: "save",
          });
          return {
            type: "success",
            result,
          } as End<KEY>;
        }
      }
    }

    try {
      const result = await wsExecute(channel, data, listener);

      return result;
    } catch (error) {
      logger().error("API execution error:", error);
      throw error;
    }
  };

  const openPath = async (path: string): Promise<End<"shell:openPath">> => {
    if (window.pipelab?.showItemInFolder) {
      await window.pipelab.showItemInFolder(path);
      return { type: "success", result: undefined };
    }
    return execute("shell:openPath", { path });
  };

  /**
   * On method (placeholder for backwards compatibility)
   */
  const on = <KEY extends Channels>(channel: KEY, listener: (data: Events<KEY>) => void) => {
    return wsOn(channel, listener);
  };

  return {
    on,
    execute,
    openPath,
    isConnected,
  };
};

type UseAPI = ReturnType<typeof useAPI>;
