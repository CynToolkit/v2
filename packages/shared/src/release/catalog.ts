import type { ProviderDefinition, RendererProviderMetadata } from "../plugins/definitions";
import type { ReleaseDescriptorRegistry, ReleaseRegistry } from "./types";
import type { MergeCatalogItems, MergeDefinition } from "./catalog.types";

export function buildReleaseRegistry(providers: ProviderDefinition[]): ReleaseRegistry;
export function buildReleaseRegistry(
  providers: RendererProviderMetadata[],
): ReleaseDescriptorRegistry;
export function buildReleaseRegistry(
  providers: Array<ProviderDefinition | RendererProviderMetadata>,
): ReleaseDescriptorRegistry {
  return {
    sources: providers.flatMap((provider) => provider.release?.sources ?? []),
    producers: providers.flatMap((provider) => provider.release?.producers ?? []),
    destinations: providers.flatMap((provider) => provider.release?.destinations ?? []),
    notifications: providers.flatMap((provider) => provider.release?.notifications ?? []),
  };
}

/** Whether the host must inspect the project: stated by the descriptor, else implied by `inspect`. */
const isInspectable = (definition: { inspectable?: boolean; inspect?: unknown }): boolean =>
  definition.inspectable ?? Boolean(definition.inspect);

export const buildReleaseCatalog = (
  registry: ReleaseDescriptorRegistry,
  host?: Parameters<
    NonNullable<ReleaseRegistry["producers"][number]["targets"][number]["isAvailable"]>
  >[0],
): import("./types").ReleaseCatalog => ({
  buildTypes: [
    { id: "desktop", label: "Desktop" },
    { id: "web", label: "Web" },
    { id: "mobile", label: "Mobile" },
    { id: "console", label: "Console" },
    { id: "bundle", label: "Bundle" },
  ],
  sources: registry.sources.map((source) => ({
    id: source.id,
    label: source.label,
    description: source.description,
    icon: source.icon,
    fields: source.fields,
    output: source.output,
    defaultConfig: source.createDefaultConfig(),
    requiresAgentInspection: isInspectable(source),
  })),
  producers: registry.producers.map((producer) => ({
    id: producer.id,
    label: producer.label,
    description: producer.description,
    icon: producer.icon,
    fields: producer.fields,
    accepts: producer.accepts,
    planning: producer.planning ?? { mode: "build" },
    supportsBeforeBuildHooks: producer.supportsBeforeBuildHooks,
    inputs: producer.inputs,
    defaultConfig: producer.createDefaultConfig(),
    requiresAgentInspection: isInspectable(producer),
    targets: producer.targets.map((target) => ({
      id: target.id,
      label: target.label,
      buildType: target.buildType,
      output: target.output,
      transform: target.transform,
      defaultConfig: target.createDefaultConfig(),
      fields: target.fields,
      availability: host && target.isAvailable ? target.isAvailable(host) : undefined,
      availabilityStatus: target.isAvailable && !host ? "unknown" : undefined,
    })),
  })),
  destinations: registry.destinations.map((destination) => ({
    id: destination.id,
    label: destination.label,
    description: destination.description,
    icon: destination.icon,
    fields: destination.fields,
    slotFields: destination.slotFields,
    accepts: destination.accepts,
    requiresBuild: destination.requiresBuild,
    defaultConfig: destination.createDefaultConfig(),
  })),
  notifications: (registry.notifications ?? []).map((notification) => ({
    id: notification.id,
    label: notification.label,
    description: notification.description,
    icon: notification.icon,
    fields: notification.fields,
    defaultConfig: notification.createDefaultConfig(),
  })),
});

const mergeCatalogItems = <T extends MergeCatalogItems>(
  bundled: T[],
  runtime: T[],
  merge: (bundled: T, runtime: T) => T,
): T[] => {
  const bundledById = new Map(bundled.map((item) => [item.id, item]));
  const runtimeIds = new Set(runtime.map((item) => item.id));
  return [
    ...runtime.map((item) => {
      const base = bundledById.get(item.id);
      return base ? merge(base, item) : item;
    }),
    ...bundled.filter((item) => !runtimeIds.has(item.id)),
  ];
};

/** Keep packaged product metadata while layering runtime-only catalog capabilities. */
export const mergeReleaseCatalog = (
  bundled: import("./types").ReleaseCatalog,
  runtime: import("./types").ReleaseCatalog,
): import("./types").ReleaseCatalog => {
  const mergeDefinition = <T extends MergeDefinition>(base: T, current: T): T => ({
    ...base,
    ...current,
    id: base.id,
    label: base.label,
    description: base.description ?? current.description,
    icon: base.icon ?? current.icon,
    fields: current.fields ?? base.fields,
    defaultConfig: { ...base.defaultConfig, ...current.defaultConfig },
  });
  return {
    buildTypes: mergeCatalogItems(bundled.buildTypes, runtime.buildTypes, (base, current) => ({
      ...base,
      ...current,
      id: base.id,
      label: base.label,
      description: base.description ?? current.description,
      icon: base.icon ?? current.icon,
    })),
    sources: mergeCatalogItems(bundled.sources, runtime.sources, mergeDefinition),
    producers: mergeCatalogItems(bundled.producers, runtime.producers, (base, current) => ({
      ...mergeDefinition(base, current),
      targets: mergeCatalogItems(base.targets, current.targets, (baseTarget, currentTarget) => ({
        ...baseTarget,
        ...currentTarget,
        id: baseTarget.id,
        label: baseTarget.label,
        fields: currentTarget.fields ?? baseTarget.fields,
        availability: currentTarget.availability,
        availabilityStatus: currentTarget.availabilityStatus,
        defaultConfig: { ...baseTarget.defaultConfig, ...currentTarget.defaultConfig },
      })),
    })),
    destinations: mergeCatalogItems(
      bundled.destinations,
      runtime.destinations,
      (base, current) => ({
        ...mergeDefinition(base, current),
      }),
    ),
    notifications: mergeCatalogItems(
      bundled.notifications ?? [],
      runtime.notifications ?? [],
      mergeDefinition,
    ),
  };
};
