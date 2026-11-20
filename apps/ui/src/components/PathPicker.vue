<template>
  <div class="path-picker">
    <InputText
      :model-value="model || ''"
      :placeholder="placeholder"
      readonly
      :aria-label="label"
      @click="pickPath"
    />
    <Button
      icon="mdi mdi-folder-open-outline"
      outlined
      severity="secondary"
      :aria-label="`Choose ${label.toLowerCase()}`"
      @click="pickPath"
    />
  </div>
</template>

<script setup lang="ts">
import { useAPI } from "@renderer/composables/api";
import type { PathPickerProps } from "./PathPicker.types";
import Button from "primevue/button";
import InputText from "primevue/inputtext";

const props = withDefaults(defineProps<PathPickerProps>(), {
  kind: "directory",
  mode: "open",
  label: "path",
  placeholder: "Select a location",
  fileExtensions: undefined,
});
const model = defineModel<string>();
const api = useAPI();

const pickPath = async () => {
  if (props.kind === "file" && props.mode === "save") {
    const result = await api.execute("dialog:showSaveDialog", {
      title: `Choose ${props.label.toLowerCase()}`,
      defaultPath: model.value || undefined,
      properties: ["createDirectory", "showOverwriteConfirmation"],
      filters: props.fileExtensions?.length
        ? [{ name: "Supported files", extensions: props.fileExtensions }]
        : undefined,
    });
    if (result.type === "success" && !result.result.canceled && result.result.filePath)
      model.value = result.result.filePath;
    return;
  }
  if (props.kind === "file") {
    const result = await api.execute("dialog:showOpenDialog", {
      title: `Choose ${props.label.toLowerCase()}`,
      defaultPath: model.value || undefined,
      properties: ["openFile"],
      filters: props.fileExtensions?.length
        ? [{ name: "Supported files", extensions: props.fileExtensions }]
        : undefined,
    });
    if (result.type === "success" && !result.result.canceled && result.result.filePaths[0])
      model.value = result.result.filePaths[0];
    return;
  }
  const result = await api.execute("dialog:showOpenDialog", {
    title: `Choose ${props.label.toLowerCase()}`,
    properties: ["openDirectory", "createDirectory", "promptToCreate"],
  });
  if (result.type === "success" && !result.result.canceled && result.result.filePaths[0])
    model.value = result.result.filePaths[0];
};
</script>

<style scoped>
.path-picker {
  display: flex;
  align-items: stretch;
  gap: 8px;
  width: 100%;
}
.path-picker :deep(.p-inputtext) {
  flex: 1;
  min-width: 0;
}
</style>
