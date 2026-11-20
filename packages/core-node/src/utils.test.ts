import { describe, expect, test } from "vitest";
import { toRendererProviderMetadata } from "./utils";
import type { RendererProviderMetadata } from "@pipelab/shared";

describe("toRendererProviderMetadata", () => {
  test("keeps renderer metadata and omits legacy node definitions", () => {
    const release = { sources: [] };
    const plugin: RendererProviderMetadata & { nodes: unknown[] } = {
      id: "@pipelab/plugin-example",
      name: "Example",
      icon: { type: "image", image: "data:image/png;base64,AAAA" },
      description: "Example plugin",
      isOfficial: true,
      packageName: "@pipelab/plugin-example",
      integrations: [{ name: "Example", fields: [] }],
      release,
      nodes: [{ node: { id: "legacy-node" }, runner: () => undefined }],
    };

    const metadata = toRendererProviderMetadata(plugin);

    expect(metadata).toEqual({
      id: plugin.id,
      name: plugin.name,
      icon: plugin.icon,
      description: plugin.description,
      isOfficial: plugin.isOfficial,
      packageName: plugin.packageName,
      integrations: plugin.integrations,
      release,
    });
    expect(metadata).not.toHaveProperty("nodes");
  });
});
