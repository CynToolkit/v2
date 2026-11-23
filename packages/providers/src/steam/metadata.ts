import type { ReleaseDestinationDescriptor, RendererProviderMetadata } from "@pipelab/shared";
import { steamProviderLogo } from "../provider-icons";

export const steamDestinationDescriptor: ReleaseDestinationDescriptor = {
  id: "@pipelab/plugin-steam/destination",
  label: "Steam",
  accepts: { kind: "application", platform: ["windows", "linux", "macos"], container: "directory" },
  fields: [
    {
      key: "accountConnectionId",
      type: "connection",
      integration: "@pipelab/plugin-steam",
      label: "Steam account",
      required: true,
    },
    { key: "appId", type: "text", label: "Steam App ID", required: true },
  ],
  slotFields: [{ key: "depotId", type: "text", label: "Depot ID", required: true }],
  createDefaultConfig: () => ({ accountConnectionId: "", appId: "" }),
};

export const steamMetadata = {
  id: "@pipelab/plugin-steam",
  packageName: "@pipelab/plugin-steam",
  name: "Steam",
  description: "Pipelab provider for publishing games to Steam via SteamCMD",
  icon: { type: "image", image: steamProviderLogo },
  isOfficial: true,
  integrations: [
    {
      name: "Steam Account",
      testable: true,
      fields: [
        {
          key: "username",
          label: "Steam Username",
          type: "text",
          placeholder: "e.g., steam_user",
        },
      ],
    },
  ],
  release: { destinations: [steamDestinationDescriptor] },
} satisfies RendererProviderMetadata;
