import type {
  Availability,
  ReleaseFieldOption,
  ReleaseProducerDescriptor,
  ReleaseSourceDescriptor,
  RendererProviderMetadata,
} from "@pipelab/shared";
import { constructProviderLogo } from "../provider-icons";
import type { ConstructTargets } from "./producer.types";

// Whatever is entered as the version is appended to the editor URL as-is; these only save typing.
export const constructVersionKeywords: ReleaseFieldOption[] = [
  { label: "latest", value: "latest" },
  { label: "beta", value: "beta" },
];

export const constructSourceDescriptor: ReleaseSourceDescriptor = {
  id: "@pipelab/plugin-construct/source",
  label: "Construct project",
  fields: [
    {
      key: "path",
      type: "file",
      label: "Project file",
      required: true,
      fileExtensions: ["c3p"],
      showInWizard: true,
    },
    {
      key: "profilePath",
      type: "select",
      label: "Browser profile",
      required: true,
    },
    {
      key: "accountConnectionId",
      type: "connection",
      integration: "Construct Account",
      label: "Construct account",
      required: false,
    },
    {
      key: "version",
      type: "text",
      label: "Construct version",
      placeholder: "Empty: the project's saved release",
      options: constructVersionKeywords,
      required: false,
    },
  ],
  output: { kind: "project", technology: "construct", container: "file" },
  inspectable: true,
  createDefaultConfig: () => ({ path: "", profilePath: "", accountConnectionId: "", version: "" }),
};

const desktopUnavailable: Availability = {
  available: false,
  reason: "Construct desktop exports are not available yet",
};

export const constructTargets: Array<ConstructTargets> = [
  {
    id: "web",
    buildType: "web",
    exportType: "web",
    output: {
      kind: "application",
      technology: "construct",
      platform: "web",
      container: "directory",
    },
    isAvailable: () => ({ available: true }),
  },
  {
    id: "webview2-windows-x64",
    buildType: "desktop",
    exportType: "webview2",
    output: {
      kind: "application",
      technology: "webview2",
      platform: "windows",
      architecture: "x64",
      container: "directory",
    },
    isAvailable: () => desktopUnavailable,
  },
  {
    id: "wkwebview-macos-arm64",
    buildType: "desktop",
    exportType: "wkwebview",
    output: {
      kind: "application",
      technology: "wkwebview",
      platform: "macos",
      architecture: "arm64",
      container: "directory",
    },
    isAvailable: () => desktopUnavailable,
  },
  {
    id: "cef-linux-x64",
    buildType: "desktop",
    exportType: "cef",
    output: {
      kind: "application",
      technology: "cef",
      platform: "linux",
      architecture: "x64",
      container: "directory",
    },
    isAvailable: () => desktopUnavailable,
  },
];

export const constructProducerDescriptor: ReleaseProducerDescriptor = {
  id: "@pipelab/plugin-construct/producer",
  label: "Construct",
  planning: { mode: "build" },
  accepts: { kind: "project", technology: "construct" },
  targets: constructTargets.map((target) => ({
    id: target.id,
    label: target.id,
    buildType: target.buildType,
    output: target.output,
    createDefaultConfig: () => ({}),
    isAvailable: target.isAvailable,
  })),
  createDefaultConfig: () => ({}),
};

export const constructMetadata = {
  id: "@pipelab/plugin-construct",
  packageName: "@pipelab/plugin-construct",
  name: "Construct",
  description: "Pipelab provider for exporting and packaging Construct 3 projects",
  icon: { type: "image", image: constructProviderLogo },
  isOfficial: true,
  integrations: [
    {
      name: "Browser Executable",
      fields: [
        {
          key: "path",
          label: "Browser Executable Path",
          type: "file",
          placeholder: "e.g., /usr/bin/google-chrome",
        },
      ],
    },
    {
      name: "Browser Profile",
      fields: [
        {
          key: "path",
          label: "Chrome profile directory",
          type: "directory",
          placeholder: "e.g., ~/.config/google-chrome",
        },
      ],
    },
    {
      name: "Construct Account",
      fields: [
        { key: "username", label: "Username", type: "text" },
        { key: "password", label: "Password", type: "password" },
      ],
      testable: true,
    },
  ],
  release: { sources: [constructSourceDescriptor], producers: [constructProducerDescriptor] },
} satisfies RendererProviderMetadata;
