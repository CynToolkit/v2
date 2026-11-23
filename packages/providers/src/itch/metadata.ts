import type { ReleaseDestinationDescriptor, RendererProviderMetadata } from "@pipelab/shared";
import { itchProviderLogo } from "../provider-icons";

export const itchDestinationDescriptor: ReleaseDestinationDescriptor = {
  id: "@pipelab/plugin-itch/destination",
  label: "Itch.io",
  accepts: { kind: ["application", "files"], container: ["directory", "archive"] },
  fields: [
    {
      key: "accountConnectionId",
      type: "connection",
      integration: "@pipelab/plugin-itch",
      label: "Itch account",
      required: true,
    },
    { key: "project", type: "text", label: "Project", required: true },
  ],
  slotFields: [{ key: "channel", type: "text", label: "Channel", required: true }],
  createDefaultConfig: () => ({ accountConnectionId: "", project: "" }),
};

export const itchMetadata = {
  id: "@pipelab/plugin-itch",
  packageName: "@pipelab/plugin-itch",
  name: "Itch.io",
  description: "Pipelab provider for publishing games to itch.io",
  icon: { type: "image", image: itchProviderLogo },
  isOfficial: true,
  integrations: [
    {
      name: "Itch Butler Account",
      testable: true,
      fields: [
        {
          key: "apiKey",
          label: "API key",
          type: "password",
          placeholder: "API key",
        },
      ],
    },
  ],
  release: { destinations: [itchDestinationDescriptor] },
} satisfies RendererProviderMetadata;
