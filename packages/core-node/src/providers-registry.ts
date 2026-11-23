import {
  constructProvider,
  electronProvider,
  godotProvider,
  tauriProvider,
  steamProvider,
  itchProvider,
  pokiProvider,
  pipelabCloudProvider,
  notificationsProvider,
} from "@pipelab/providers";
import { builtInProviderMetadata } from "@pipelab/providers/metadata";
import type { ProviderDefinition } from "@pipelab/shared";
import type { ProviderServices } from "./workflow-tasks";

const providerDefinitions: ProviderDefinition<ProviderServices>[] = [
  constructProvider,
  electronProvider,
  godotProvider,
  tauriProvider,
  steamProvider,
  itchProvider,
  pokiProvider,
  pipelabCloudProvider,
  notificationsProvider,
];

/**
 * Resolves each provider's host definition in the order of the browser-safe metadata list, which
 * is the single place that order is defined. A provider missing from either side fails at startup.
 */
const orderLike = (
  metadata: readonly { id: string }[],
  definitions: readonly ProviderDefinition<ProviderServices>[],
): ProviderDefinition<ProviderServices>[] => {
  const byId = new Map(definitions.map((definition) => [definition.id, definition]));
  const ordered = metadata.map(({ id }) => {
    const definition = byId.get(id);
    if (!definition) throw new Error(`Provider metadata ${id} has no host definition`);
    return definition;
  });
  const missing = definitions.filter(
    (definition) => !metadata.some(({ id }) => id === definition.id),
  );
  if (missing.length)
    throw new Error(`Providers without metadata: ${missing.map(({ id }) => id).join(", ")}`);
  return ordered;
};

/** The statically bundled providers shared by metadata, Release, and task setup. */
export const builtInProviders: ProviderDefinition<ProviderServices>[] = orderLike(
  builtInProviderMetadata,
  providerDefinitions,
);

export const assertUniqueProviderIds = <TServices>(
  providers: readonly ProviderDefinition<TServices>[],
): void => {
  const seen = new Set<string>();
  for (const provider of providers) {
    if (seen.has(provider.id)) {
      throw new Error(`Duplicate provider ID: ${provider.id}`);
    }
    seen.add(provider.id);
  }
};

assertUniqueProviderIds(builtInProviders);
