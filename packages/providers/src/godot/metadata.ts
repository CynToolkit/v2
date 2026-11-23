import type {
  ReleaseProducerDescriptor,
  ReleaseSourceDescriptor,
  RendererProviderMetadata,
} from "@pipelab/shared";
import { godotProviderLogo } from "../provider-icons";

export const targetDescriptors = {
  "windows-x64": {
    kind: "application" as const,
    technology: "godot",
    platform: "windows",
    architecture: "x64",
    container: "directory" as const,
  },
  "linux-x64": {
    kind: "application" as const,
    technology: "godot",
    platform: "linux",
    architecture: "x64",
    container: "directory" as const,
  },
  "macos-arm64": {
    kind: "application" as const,
    technology: "godot",
    platform: "macos",
    architecture: "arm64",
    container: "directory" as const,
  },
  web: {
    kind: "application" as const,
    technology: "godot",
    platform: "web",
    container: "directory" as const,
  },
};

export const godotSourceDescriptor: ReleaseSourceDescriptor = {
  id: "@pipelab/plugin-godot/source",
  label: "Godot project",
  fields: [
    { key: "path", type: "directory", label: "Project path", required: true, showInWizard: true },
  ],
  output: { kind: "project", technology: "godot", container: "directory" },
  inspectable: true,
  createDefaultConfig: () => ({ path: "" }),
};

export const godotExporterDescriptor: ReleaseProducerDescriptor = {
  id: "@pipelab/plugin-godot/producer",
  label: "Godot exporter",
  planning: { mode: "build" },
  accepts: { kind: "project", technology: "godot", container: "directory" },
  inspectable: true,
  targets: Object.entries(targetDescriptors).map(([id, output]) => ({
    id,
    label: id,
    buildType: id === "web" ? "web" : "desktop",
    output,
    fields: [
      {
        key: "preset",
        type: "select" as const,
        label: "Godot export preset",
        required: true,
      },
    ],
    createDefaultConfig: () => ({ preset: "" }),
    isAvailable: () => ({ available: true }),
  })),
  createDefaultConfig: () => ({ executable: "" }),
};

export const godotMetadata = {
  id: "@pipelab/plugin-godot",
  packageName: "@pipelab/plugin-godot",
  name: "Godot",
  description: "Godot Release provider",
  icon: { type: "image", image: godotProviderLogo },
  isOfficial: true,
  release: { sources: [godotSourceDescriptor], producers: [godotExporterDescriptor] },
} satisfies RendererProviderMetadata;
