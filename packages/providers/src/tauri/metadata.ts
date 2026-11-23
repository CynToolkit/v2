import { pickLiteral } from "@pipelab/shared";
import type { ReleaseProducerDescriptor, RendererProviderMetadata } from "@pipelab/shared";
import type { DesktopTargetInputs } from "@pipelab/plugin-core";
import { requiresHostOfSamePlatform } from "../host-matrix";
import { tauriProviderLogo } from "../provider-icons";

export const tauriTargetInputs = (targetId: string): DesktopTargetInputs => {
  const [target, arch] = targetId.split("-");
  const platform = target === "windows" ? "win32" : target === "macos" ? "darwin" : "linux";
  const supportedArch = pickLiteral(["x64", "arm64"], arch);
  if (!supportedArch) throw new Error(`Unsupported Tauri target: ${targetId}`);
  return { platform, arch: supportedArch };
};

const tauriTargetDescriptor = (id: string) => {
  const inputs = tauriTargetInputs(id);
  return {
    kind: "application" as const,
    technology: "tauri",
    platform:
      inputs.platform === "win32" ? "windows" : inputs.platform === "darwin" ? "macos" : "linux",
    architecture: inputs.arch,
    container: "directory" as const,
  };
};

export const tauriProducerDescriptor: ReleaseProducerDescriptor = {
  id: "@pipelab/plugin-tauri/producer",
  label: "Tauri",
  planning: { mode: "build" },
  accepts: { kind: "application", platform: "web", container: "directory" },
  targets: ["windows-x64", "linux-x64", "macos-arm64"].map((id) => ({
    id,
    label: id,
    buildType: "desktop",
    output: tauriTargetDescriptor(id),
    createDefaultConfig: () => ({}),
    isAvailable: (host) => requiresHostOfSamePlatform(tauriTargetDescriptor(id).platform, host),
  })),
  createDefaultConfig: () => ({}),
};

export const tauriMetadata = {
  id: "@pipelab/plugin-tauri",
  packageName: "@pipelab/plugin-tauri",
  name: "Tauri",
  description: "Pipelab provider for packaging apps with Tauri",
  icon: { type: "image", image: tauriProviderLogo },
  isOfficial: true,
  release: { producers: [tauriProducerDescriptor] },
} satisfies RendererProviderMetadata;
