import { pickLiteral } from "@pipelab/shared";
import type {
  DesktopTargetInputs,
  ReleaseProducerDescriptor,
  RendererProviderMetadata,
} from "@pipelab/shared";
import { requiresMacHostForMacTargets } from "../host-matrix";
import { electronProviderLogo } from "../provider-icons";

export const electronTargetInputs = (targetId: string): DesktopTargetInputs => {
  const [target, arch] = targetId.split("-");
  const platform = target === "windows" ? "win32" : target === "macos" ? "darwin" : "linux";
  const supportedArch = pickLiteral(["x64", "arm64"], arch);
  if (!supportedArch) throw new Error(`Unsupported Electron target: ${targetId}`);
  return { platform, arch: supportedArch };
};

const electronTargetDescriptor = (id: string) => {
  const inputs = electronTargetInputs(id);
  return {
    kind: "application" as const,
    technology: "electron",
    platform:
      inputs.platform === "win32" ? "windows" : inputs.platform === "darwin" ? "macos" : "linux",
    architecture: inputs.arch,
    container: "directory" as const,
  };
};

export const electronProducerDescriptor: ReleaseProducerDescriptor = {
  id: "@pipelab/plugin-electron/producer",
  label: "Electron",
  planning: { mode: "build" },
  supportsBeforeBuildHooks: true,
  accepts: { kind: "application", platform: "web", container: "directory" },
  targets: ["windows-x64", "windows-arm64", "linux-x64", "linux-arm64", "macos-arm64"].map(
    (id) => ({
      id,
      label: id,
      buildType: "desktop",
      output: electronTargetDescriptor(id),
      createDefaultConfig: () => ({}),
      isAvailable: (host) =>
        requiresMacHostForMacTargets(electronTargetDescriptor(id).platform, host),
    }),
  ),
  createDefaultConfig: () => ({}),
};

export const electronMetadata = {
  id: "@pipelab/plugin-electron",
  packageName: "@pipelab/plugin-electron",
  name: "Electron",
  description: "Pipelab provider for packaging apps with Electron",
  icon: { type: "image", image: electronProviderLogo },
  isOfficial: true,
  release: { producers: [electronProducerDescriptor] },
} satisfies RendererProviderMetadata;
