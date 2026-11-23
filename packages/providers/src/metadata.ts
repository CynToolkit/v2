import {
  BROWSER_PROVIDER_SPECS_SCHEMA_VERSION,
  buildReleaseCatalog,
  builtInReleaseDescriptors,
  RELEASE_CONFIG_VERSION,
  type BrowserProviderSpecs,
  type ReleaseDescriptorRegistry,
  type RendererProviderMetadata,
} from "@pipelab/shared";
import { constructMetadata } from "./construct/metadata";
import { electronMetadata } from "./electron/metadata";
import { godotMetadata } from "./godot/metadata";
import { itchMetadata } from "./itch/metadata";
import { notificationsMetadata } from "./notifications/metadata";
import { pipelabCloudMetadata } from "./pipelab-cloud/metadata";
import { pokiMetadata } from "./poki/metadata";
import { steamMetadata } from "./steam/metadata";
import { tauriMetadata } from "./tauri/metadata";

/**
 * Browser-safe entry point (`@pipelab/providers/metadata`): provider identity, integrations and
 * Release descriptors, without any workflow task, compiler or Node dependency. The UI builds its
 * catalog from this; hosts use the full provider definitions. Keep this module's import graph free
 * of Node built-ins (see `metadata.test.ts`).
 */
export const builtInProviderMetadata: RendererProviderMetadata[] = [
  constructMetadata,
  electronMetadata,
  steamMetadata,
  itchMetadata,
  pokiMetadata,
  tauriMetadata,
  godotMetadata,
  pipelabCloudMetadata,
  notificationsMetadata,
];

/** The serializable provider data the browser can use before any host is connected. */
const buildDescriptorRegistry = (): ReleaseDescriptorRegistry => {
  const releases = [
    builtInReleaseDescriptors,
    ...builtInProviderMetadata.map((p) => p.release ?? {}),
  ];
  return {
    sources: releases.flatMap((release) => release.sources ?? []),
    producers: releases.flatMap((release) => release.producers ?? []),
    destinations: releases.flatMap((release) => release.destinations ?? []),
    notifications: releases.flatMap((release) => release.notifications ?? []),
  };
};

export const buildBrowserProviderSpecs = (): BrowserProviderSpecs => ({
  schemaVersion: BROWSER_PROVIDER_SPECS_SCHEMA_VERSION,
  releaseConfigVersion: RELEASE_CONFIG_VERSION,
  catalog: buildReleaseCatalog(buildDescriptorRegistry()),
  providers: builtInProviderMetadata.map(
    ({ id, name, icon, description, isOfficial, packageName, integrations }) => ({
      id,
      name,
      icon,
      description,
      isOfficial,
      packageName,
      integrations,
    }),
  ),
});
