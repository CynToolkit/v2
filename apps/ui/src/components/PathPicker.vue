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
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { useAPI } from "@renderer/composables/api";

const props = withDefaults(
  defineProps<{
    kind?: "directory" | "file";
    /** `save` lets the user name a file that does not exist yet (output paths). */
    mode?: "open" | "save";
    label?: string;
    placeholder?: string;
    fileExtensions?: string[];
  }>(),
  {
    kind: "directory",
    mode: "open",
    label: "path",
    placeholder: "Select a location",
    fileExtensions: undefined,
  },
);
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
