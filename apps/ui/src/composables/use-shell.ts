import { useUIStore, type FilePickerOptions } from "../store/ui";

/**
 * Composable for interacting with the shell (Electron or Web fallback)
 */
export const useShell = () => {
  const uiStore = useUIStore();

  /**
   * Open a file dialog
   */
  const openFile = async (options: Partial<FilePickerOptions> = {}) => {
    if (window.electron) {
      try {
        // De-proxy reactive objects for Electron IPC
        const plainOptions = JSON.parse(JSON.stringify(options));

        const result = await window.pipelab!.showOpenDialog({
          ...plainOptions,
          properties: ["openFile", ...(plainOptions.properties || [])],
        });
        return { type: "success", result };
      } catch (e) {
        return {
          type: "error",
          ipcError: e instanceof Error ? e.message : String(e),
        };
      }
    }

    const result = await uiStore.showFilePicker({
      ...options,
      mode: "open",
    });
    return {
      type: "success",
      result,
    };
  };

  /**
   * Open a directory dialog
   */
  const openDirectory = async (options: Partial<FilePickerOptions> = {}) => {
    if (window.electron) {
      try {
        const plainOptions = JSON.parse(JSON.stringify(options));
        const result = await window.pipelab!.showOpenDialog({
          ...plainOptions,
          properties: ["openDirectory", ...(plainOptions.properties || [])],
        });
        return {
          type: "success",
          result,
        };
      } catch (e) {
        return {
          type: "error",
          ipcError: e instanceof Error ? e.message : String(e),
        };
      }
    }

    const result = await uiStore.showFilePicker({
      ...options,
      mode: "open",
    });
    return {
      type: "success",
      result,
    };
  };

  /**
   * Open a save file dialog
   */
  const saveFile = async (options: Partial<FilePickerOptions> = {}) => {
    if (window.electron) {
      try {
        const result = await window.pipelab!.showSaveDialog(JSON.parse(JSON.stringify(options)));
        return {
          type: "success",
          result,
        };
      } catch (e) {
        return {
          type: "error",
          ipcError: e instanceof Error ? e.message : String(e),
        };
      }
    }

    const result = await uiStore.showFilePicker({
      ...options,
      mode: "save",
    });
    return {
      type: "success",
      result,
    };
  };

  /**
   * Open an external URL
   */
  const openExternal = async (url: string) => {
    if (window.electron) {
      return await window.pipelab!.openExternal(url);
    }
    window.open(url, "_blank");
  };

  /**
   * Show a file in the system file explorer
   */
  const showItemInFolder = (path: string) => {
    if (window.electron) {
      return window.pipelab!.showItemInFolder(path);
    }
    console.warn("showItemInFolder not supported on web");
  };

  /**
   * Relaunch the application
   */
  const relaunch = async () => {
    if (window.electron) {
      await window.pipelab!.relaunch();
    } else {
      console.warn("relaunch not supported on web, reloading page...");
      window.location.reload();
    }
  };

  /**
   * Quit and install the downloaded update
   */
  const installUpdate = async () => {
    await window.pipelab?.installUpdate();
  };

  return {
    openFile,
    openDirectory,
    saveFile,
    openExternal,
    showItemInFolder,
    relaunch,
    installUpdate,
  };
};
