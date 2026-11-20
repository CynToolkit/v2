import * as v from "valibot";
import {
  useLogger,
  type Channels,
  type Data,
  type End,
  type EndEvent,
  type Events,
  type ShellChannel,
  type WebSocketListener,
} from "@pipelab/shared";
import { useWebSocketAPI } from "./websocket-client";
import { useUIStore } from "../store/ui";

// Re-export for backwards compatibility
export type { WebSocketListener };

/** One shell channel answered natively: by Electron, or by the web file picker when headless. */
type ShellHandlers = {
  [KEY in Channels]?: (data: Data<KEY> | undefined) => Promise<End<KEY>>;
};

type ElectronInvoke = (channel: string, data: unknown) => Promise<unknown>;

const OpenDialogResultSchema = v.object({
  canceled: v.boolean(),
  filePaths: v.array(v.string()),
});

const SaveDialogResultSchema = v.object({
  canceled: v.boolean(),
  filePath: v.union([v.string(), v.undefined()]),
});

/**
 * Calls an Electron shell channel and validates what comes back, since the IPC boundary
 * returns `unknown`.
 */
const invokeShell = async <RESULT>(
  invoke: ElectronInvoke,
  channel: ShellChannel,
  data: unknown,
  schema: v.GenericSchema<unknown, RESULT>,
): Promise<EndEvent<RESULT>["data"]> => {
  try {
    // Vue reactive values cannot cross Electron's structured-clone IPC boundary.
    const ipcData = data === undefined ? undefined : JSON.parse(JSON.stringify(data));
    const result = await invoke(channel, ipcData);
    const parsed = v.safeParse(schema, result);
    if (!parsed.success) {
      return {
        type: "error",
        ipcError: `Unexpected result from "${channel}": ${parsed.issues[0].message}`,
      };
    }
    return { type: "success", result: parsed.output };
  } catch (error) {
    useLogger().logger().error("Shell channel IPC invoke error:", error);
    return {
      type: "error",
      ipcError: error instanceof Error ? error.message : String(error),
    };
  }
};

const electronShellHandlers = (invoke: ElectronInvoke): ShellHandlers => ({
  "dialog:showOpenDialog": (data) =>
    invokeShell(invoke, "dialog:showOpenDialog", data, OpenDialogResultSchema),
  "dialog:showSaveDialog": (data) =>
    invokeShell(invoke, "dialog:showSaveDialog", data, SaveDialogResultSchema),
  "shell:openPath": async (data) => {
    if (!data) return { type: "error", ipcError: 'Missing "path" for shell:openPath' };
    return invokeShell(invoke, "shell:openPath", data, v.undefined());
  },
});

export const useAPI = () => {
  const { logger } = useLogger();
  const { execute: wsExecute, isConnected, on: wsOn } = useWebSocketAPI();
  const uiStore = useUIStore();

  /** Shell handlers for the current host; a channel they don't cover is answered by the agent. */
  const shellHandlers = (): ShellHandlers => {
    const electron = window.electron;
    if (electron) {
      return electronShellHandlers((name, data) => electron.ipcRenderer.invoke(name, data));
    }
    // Headless fallback: the web file picker stands in for the native dialogs.
    return {
      "dialog:showOpenDialog": async (data) => {
        logger().debug("Falling back to web file picker (open):", data);
        const result = await uiStore.showFilePicker({ ...data, mode: "open" });
        return {
          type: "success",
          result: { canceled: result.canceled, filePaths: result.filePaths ?? [] },
        };
      },
      "dialog:showSaveDialog": async (data) => {
        logger().debug("Falling back to web file picker (save):", data);
        const result = await uiStore.showFilePicker({ ...data, mode: "save" });
        return {
          type: "success",
          result: { canceled: result.canceled, filePath: result.filePath },
        };
      },
    };
  };

  /**
   * Send an order and wait for its execution
   */
  const execute = async <KEY extends Channels>(
    channel: KEY,
    data?: Data<KEY>,
    listener?: WebSocketListener<KEY>,
  ): Promise<End<KEY>> => {
    const shellHandler = shellHandlers()[channel];
    if (shellHandler) {
      logger().debug("Handling shell channel locally:", channel);
      return shellHandler(data);
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
