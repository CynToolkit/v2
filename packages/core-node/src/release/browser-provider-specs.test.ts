import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { buildBrowserProviderSpecs } from "./browser-provider-specs";

const artifactPath = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../../apps/ui/src/generated/release-provider-specs.ts",
);
const artifact = readFileSync(artifactPath, "utf8");

const readGeneratedSpecs = async () => {
  const generated: { default?: unknown } = await import(
    /* @vite-ignore */ pathToFileURL(artifactPath).href
  );
  if (!generated.default) throw new Error("Generated browser provider specs are missing");
  return generated.default;
};

describe("browser provider specs", () => {
  it("matches the generated artifact to the current built-in registry", async () => {
    expect(await readGeneratedSpecs()).toEqual(buildBrowserProviderSpecs());
  });

  it("contains only renderer-safe metadata and never guesses host availability", () => {
    const specs = buildBrowserProviderSpecs();
    const serialized = JSON.stringify(specs);

    expect(serialized).not.toMatch(/workflowTasks|compile\s*\(|isAvailable/);
    expect(artifact).not.toMatch(/@pipelab\/core-node|node:/);
    expect(artifact).not.toMatch(/workflowTasks|compile\s*\(|isAvailable/);
    expect(specs.providers.every((provider) => !("release" in provider))).toBe(true);
    const defaultConfigs = [
      ...specs.catalog.sources.map((source) => source.defaultConfig),
      ...specs.catalog.producers.flatMap((producer) => [
        producer.defaultConfig,
        ...producer.targets.map((target) => target.defaultConfig),
      ]),
      ...specs.catalog.destinations.map((destination) => destination.defaultConfig),
    ];
    for (const config of defaultConfigs)
      for (const [key, value] of Object.entries(config))
        if (/password|secret|token|credential|api.?key/i.test(key)) expect(value).toBe("");
    const credentialFields = specs.providers.flatMap((provider) =>
      (provider.integrations ?? []).flatMap((integration) =>
        (integration.fields ?? []).filter((field) =>
          /password|secret|token|credential|api.?key/i.test(field.key),
        ),
      ),
    );
    expect(credentialFields.length).toBeGreaterThan(0);
    expect(credentialFields.every((field) => field.type === "password")).toBe(true);
    for (const field of credentialFields) {
      expect(field).not.toHaveProperty("value");
      expect(field).not.toHaveProperty("default");
      expect(field).not.toHaveProperty("defaultValue");
    }
    expect(
      specs.catalog.producers
        .flatMap((producer) => producer.targets)
        .some((target) => target.availabilityStatus === "unknown"),
    ).toBe(true);
    expect(
      specs.catalog.producers
        .flatMap((producer) => producer.targets)
        .filter((target) => target.availabilityStatus === "unknown")
        .every((target) => target.availability === undefined),
    ).toBe(true);
    expect(() => JSON.parse(serialized)).not.toThrow();
  });
});
