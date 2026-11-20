import { defineStore } from "pinia";
import { ref } from "vue";

export interface FilePickerOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  message?: string;
  nameFieldLabel?: string;
  properties?: Array<
    | "openFile"
    | "openDirectory"
    | "multiSelections"
    | "showHiddenFiles"
    | "createDirectory"
    | "promptToCreate"
    | "noResolveAliases"
    | "treatPackageAsDirectory"
    | "dontAddToRecent"
    | "showOverwriteConfirmation"
  >;
  filters?: { name: string; extensions: string[] }[];
  mode: "open" | "save";
}

export interface FilePickerResult {
  canceled: boolean;
  filePath?: string;
  filePaths?: string[];
}

export const useUIStore = defineStore("ui", () => {
  const isFilePickerVisible = ref(false);
  const filePickerOptions = ref<FilePickerOptions | null>(null);
  const filePickerResolve = ref<((value: FilePickerResult) => void) | null>(null);

  const showFilePicker = (options: FilePickerOptions): Promise<FilePickerResult> => {
    isFilePickerVisible.value = true;
    filePickerOptions.value = options;

    return new Promise((resolve) => {
      filePickerResolve.value = resolve;
    });
  };

  const resolveFilePicker = (result: FilePickerResult) => {
    isFilePickerVisible.value = false;
    if (filePickerResolve.value) {
      filePickerResolve.value(result);
      filePickerResolve.value = null;
    }
  };

  return {
    isFilePickerVisible,
    filePickerOptions,
    showFilePicker,
    resolveFilePicker,
  };
});
