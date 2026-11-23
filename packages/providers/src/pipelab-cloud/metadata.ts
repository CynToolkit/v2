import type { ReleaseDestinationDescriptor, RendererProviderMetadata } from "@pipelab/shared";
import { pipelabProviderLogo } from "../provider-icons";

export const pipelabCloudDestinationDescriptor: ReleaseDestinationDescriptor = {
  id: "@pipelab/pipelab-cloud/destination",
  label: "Pipelab Cloud",
  description: "Store selected build artifacts in your private Pipelab Cloud storage.",
  icon: { type: "image", image: pipelabProviderLogo },
  accepts: { kind: "application", container: ["file", "directory", "archive"] },
  createDefaultConfig: () => ({}),
};

export const pipelabCloudMetadata = {
  id: "@pipelab/pipelab-cloud",
  packageName: "@pipelab/providers",
  name: "Pipelab Cloud",
  description: "Store and share selected Pipelab build artifacts.",
  icon: { type: "image", image: pipelabProviderLogo },
  isOfficial: true,
  release: { destinations: [pipelabCloudDestinationDescriptor] },
} satisfies RendererProviderMetadata;
