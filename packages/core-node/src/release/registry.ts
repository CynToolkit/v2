import type { ProviderReleaseDefinition, ReleaseRegistry } from "@pipelab/shared";
import { builtInReleaseDefinitions } from "./builtins";
import { builtInProviders } from "../providers-registry";

export const assertUniqueReleaseIds = (
  contributionType: "source" | "producer" | "destination" | "notification",
  ids: readonly string[],
): void => {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new Error(`Duplicate Release ${contributionType} ID: ${id}`);
    }
    seen.add(id);
  }
};

/** A descriptor's `inspectable` flag must match whether its implementation can inspect. */
export const assertInspectableConsistent = (
  definitions: readonly { id: string; inspectable?: boolean; inspect?: unknown }[],
): void => {
  for (const definition of definitions) {
    if (
      definition.inspectable !== undefined &&
      definition.inspectable !== Boolean(definition.inspect)
    )
      throw new Error(
        `Release definition ${definition.id} declares inspectable=${definition.inspectable} but ${definition.inspect ? "has" : "lacks"} an inspect implementation`,
      );
  }
};

export const buildCoreReleaseRegistry = (): ReleaseRegistry => {
  const definitions: ProviderReleaseDefinition[] = [
    builtInReleaseDefinitions,
    ...builtInProviders.map((provider) => provider.release ?? {}),
  ];
  const registry: ReleaseRegistry = {
    sources: definitions.flatMap((release) => release.sources ?? []),
    producers: definitions.flatMap((release) => release.producers ?? []),
    destinations: definitions.flatMap((release) => release.destinations ?? []),
    notifications: definitions.flatMap((release) => release.notifications ?? []),
  };

  assertInspectableConsistent([...registry.sources, ...registry.producers]);

  assertUniqueReleaseIds(
    "source",
    registry.sources.map((source) => source.id),
  );
  assertUniqueReleaseIds(
    "producer",
    registry.producers.map((producer) => producer.id),
  );
  assertUniqueReleaseIds(
    "destination",
    registry.destinations.map((destination) => destination.id),
  );

  assertUniqueReleaseIds(
    "notification",
    (registry.notifications ?? []).map((notification) => notification.id),
  );

  return registry;
};
