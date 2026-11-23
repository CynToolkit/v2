import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildBrowserProviderSpecs } from "./metadata";

const sourceRoot = dirname(fileURLToPath(import.meta.url));

/**
 * Every relative module reachable from `entry`, plus the bare specifiers they import. Type-only
 * imports count: the UI typechecks whatever they reach, so a type leak breaks it as well.
 */
const importGraph = (entry: string) => {
  const files = new Set<string>();
  const specifiers = new Set<string>();
  const visit = (file: string) => {
    if (files.has(file)) return;
    files.add(file);
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/(?:import|export)\s+[^;]*?from\s+["']([^"']+)["']/g)) {
      const specifier = match[1];
      if (specifier.startsWith(".")) {
        const base = resolve(dirname(file), specifier);
        visit(base.endsWith(".ts") ? base : `${base}.ts`);
      } else specifiers.add(specifier);
    }
  };
  visit(entry);
  return { files, specifiers };
};

describe("browser provider metadata", () => {
  it("never reaches Node built-ins or host-only packages", () => {
    const { files, specifiers } = importGraph(resolve(sourceRoot, "metadata.ts"));
    expect(files.size).toBeGreaterThan(10);
    // Only the shared package: anything else would be host code or a Node dependency.
    expect([...specifiers]).toEqual(["@pipelab/shared"]);
  });

  it("contains only renderer-safe metadata and never guesses host availability", () => {
    const specs = buildBrowserProviderSpecs();
    const serialized = JSON.stringify(specs);

    expect(serialized).not.toMatch(/workflowTasks|compile\s*\(|isAvailable/);
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
