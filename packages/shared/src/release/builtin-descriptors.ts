import { CORE_WORKFLOW_TASKS } from "@pipelab/workflow-runtime/task-ids";
import type {
  ProviderReleaseDescriptor,
  ReleaseDestinationDescriptor,
  ReleaseProducerDescriptor,
  ReleaseSourceDescriptor,
} from "./types";

/** Catalog data of Pipelab's own Release contributions; their behavior lives in core-node. */
export const folderOutput = { kind: "files", container: "directory" } as const;
export const webFolderOutput = {
  kind: "application",
  platform: "web",
  container: "directory",
} as const;
export const bundleZipOutput = { kind: "files", container: "archive", format: "zip" } as const;

export const folderSourceDescriptor: ReleaseSourceDescriptor = {
  id: "@pipelab/core/source/folder",
  label: "Folder",
  fields: [{ key: "path", type: "directory", label: "Folder path", required: true }],
  output: folderOutput,
  createDefaultConfig: () => ({ path: "" }),
};

export const webFolderSourceDescriptor: ReleaseSourceDescriptor = {
  ...folderSourceDescriptor,
  id: "@pipelab/core/source/web-folder",
  label: "Web app folder",
  output: webFolderOutput,
};

export const zipSourceDescriptor = (
  id: string,
  label: string,
  output: ReleaseSourceDescriptor["output"],
): ReleaseSourceDescriptor => ({
  id,
  label,
  fields: [
    { key: "path", type: "file", label: "ZIP path", required: true, fileExtensions: ["zip"] },
  ],
  output,
  createDefaultConfig: () => ({ path: "" }),
});

export const genericZipSourceDescriptor = zipSourceDescriptor("@pipelab/core/source/zip", "ZIP", {
  kind: "files",
  container: "archive",
  format: "zip",
});
export const webZipSourceDescriptor = zipSourceDescriptor(
  "@pipelab/core/source/web-zip",
  "Web app ZIP",
  { kind: "application", platform: "web", container: "archive", format: "zip" },
);

export const folderDestinationDescriptor: ReleaseDestinationDescriptor = {
  id: "@pipelab/core/destination/folder",
  label: "Folder",
  icon: { type: "icon", icon: "mdi-folder-outline" },
  accepts: {},
  requiresBuild: true,
  fields: [],
  slotFields: [{ key: "outputDir", type: "directory", label: "Output folder", required: true }],
  createDefaultConfig: () => ({}),
};

export const zipDestinationDescriptor: ReleaseDestinationDescriptor = {
  id: "@pipelab/core/destination/zip",
  label: "ZIP",
  icon: { type: "icon", icon: "mdi-folder-zip-outline" },
  accepts: { container: ["directory", "archive"] },
  fields: [],
  slotFields: [
    {
      key: "outputPath",
      type: "file",
      label: "ZIP output path",
      required: true,
      fileExtensions: ["zip"],
      pathMode: "save",
    },
  ],
  createDefaultConfig: () => ({}),
};

export const bundleProducerDescriptor: ReleaseProducerDescriptor = {
  id: "@pipelab/core/bundle",
  label: "Bundle",
  planning: { mode: "build" },
  inputs: "many",
  accepts: { kind: ["application", "files"], container: ["directory", "archive"] },
  targets: [
    {
      id: "zip",
      label: "ZIP archive",
      buildType: "bundle",
      output: bundleZipOutput,
      createDefaultConfig: () => ({}),
    },
  ],
  createDefaultConfig: () => ({}),
};

export const unzipProducerDescriptor: ReleaseProducerDescriptor = {
  id: "@pipelab/core/unzip",
  label: "Extract ZIP",
  planning: { mode: "automatic" },
  accepts: { container: "archive", format: "zip" },
  targets: [
    {
      id: "output",
      label: "Extracted files",
      transform: { changes: { container: "directory" }, remove: ["format"] },
      createDefaultConfig: () => ({}),
    },
  ],
  createDefaultConfig: () => ({}),
};

export const passthroughProducerDescriptor: ReleaseProducerDescriptor = {
  id: CORE_WORKFLOW_TASKS.passthrough,
  label: "Passthrough",
  planning: { mode: "automatic" },
  accepts: {},
  targets: [
    { id: "output", label: "Output", transform: { changes: {} }, createDefaultConfig: () => ({}) },
  ],
  createDefaultConfig: () => ({}),
};

export const builtInReleaseDescriptors: ProviderReleaseDescriptor = {
  sources: [
    folderSourceDescriptor,
    webFolderSourceDescriptor,
    genericZipSourceDescriptor,
    webZipSourceDescriptor,
  ],
  producers: [passthroughProducerDescriptor, unzipProducerDescriptor, bundleProducerDescriptor],
  destinations: [folderDestinationDescriptor, zipDestinationDescriptor],
};
