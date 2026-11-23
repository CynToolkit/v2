import type { ReleaseDestinationDescriptor, RendererProviderMetadata } from "@pipelab/shared";
import { pokiProviderLogo } from "../provider-icons";

export const pokiDestinationDescriptor: ReleaseDestinationDescriptor = {
  id: "@pipelab/plugin-poki/destination",
  label: "Poki",
  accepts: { kind: "application", platform: "web", container: "directory" },
  fields: [
    {
      key: "accountConnectionId",
      type: "connection",
      integration: "@pipelab/plugin-poki",
      label: "Poki account",
    },
    { key: "project", type: "text", label: "Poki project", required: true },
  ],
  createDefaultConfig: () => ({ accountConnectionId: "", project: "" }),
};

export const pokiMetadata = {
  id: "@pipelab/plugin-poki",
  packageName: "@pipelab/plugin-poki",
  name: "Poki",
  description: "Pipelab provider for publishing HTML5 games to Poki",
  icon: { type: "image", image: pokiProviderLogo },
  isOfficial: true,
  integrations: [
    {
      name: "Poki Account",
      testable: true,
      fields: [
        {
          key: "account",
          label: "Account name",
          type: "text",
          placeholder: "e.g., studio",
        },
      ],
    },
  ],
  release: { destinations: [pokiDestinationDescriptor] },
} satisfies RendererProviderMetadata;
