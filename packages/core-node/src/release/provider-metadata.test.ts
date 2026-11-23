import { buildReleaseCatalog } from "@pipelab/shared";
import { builtInProviderMetadata, buildBrowserProviderSpecs } from "@pipelab/providers/metadata";
import { describe, expect, it } from "vitest";
import { builtInProviders } from "../providers-registry";
import { assertInspectableConsistent, buildCoreReleaseRegistry } from "./registry";

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

  it("rejects a definition whose inspectable flag disagrees with its implementation", () => {
    const inspect = async () => ({ issues: [] });
    expect(() => assertInspectableConsistent([{ id: "a", inspectable: true }])).toThrow(/lacks/);
    expect(() => assertInspectableConsistent([{ id: "b", inspectable: false, inspect }])).toThrow(
      /has/,
    );
    expect(() =>
      assertInspectableConsistent([{ id: "c", inspectable: true, inspect }, { id: "d" }]),
    ).not.toThrow();
  });
});
