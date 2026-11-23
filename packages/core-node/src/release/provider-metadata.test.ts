import { buildReleaseCatalog } from "@pipelab/shared";
import { builtInProviderMetadata, buildBrowserProviderSpecs } from "@pipelab/providers/metadata";
import { describe, expect, it } from "vitest";
import { builtInProviders } from "../providers-registry";
import { buildCoreReleaseRegistry } from "./registry";

describe("browser provider metadata", () => {
  it("lists the same providers, in the same order, as the host registry", () => {
    expect(builtInProviderMetadata.map((provider) => provider.id)).toEqual(
      builtInProviders.map((provider) => provider.id),
    );
  });

  it("builds the same catalog as the full host registry", () => {
    expect(buildBrowserProviderSpecs().catalog).toEqual(
      buildReleaseCatalog(buildCoreReleaseRegistry()),
    );
  });

  it("describes every provider's identity and integrations like its definition", () => {
    const specs = buildBrowserProviderSpecs().providers;
    expect(specs).toEqual(
      builtInProviders.map(
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
    );
  });

  it("states inspectability explicitly wherever a definition can inspect", () => {
    for (const registry of [buildCoreReleaseRegistry()])
      for (const definition of [...registry.sources, ...registry.producers])
        expect(definition.inspectable ?? false).toBe(Boolean(definition.inspect));
  });
});
