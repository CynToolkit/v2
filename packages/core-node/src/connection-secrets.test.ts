import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ConnectionsConfig } from "@pipelab/shared";
import { PipelabContext } from "./context";
import { loadStrictConnections, saveStrictConnections } from "./strict-config-persistence";

const keyring = vi.hoisted(() => ({
  available: true,
  stored: undefined as Uint8Array | undefined,
}));

vi.mock("@napi-rs/keyring", () => ({
  AsyncEntry: class {
    async getSecret() {
      if (!keyring.available) throw new Error("no keyring");
      return keyring.stored;
    }
    async setSecret(key: Uint8Array) {
      if (!keyring.available) throw new Error("no keyring");
      keyring.stored = key;
    }
  },
}));

const config: ConnectionsConfig = {
  version: "1.0.0",
  connections: [
    {
      id: "c1",
      pluginName: "itch",
      name: "Itch",
      createdAt: "2026-01-01T00:00:00.000Z",
      isDefault: true,
      apiKey: "super-secret-key",
    },
    {
      id: "c2",
      pluginName: "other",
      name: "No values",
      createdAt: "2026-01-01T00:00:00.000Z",
      isDefault: false,
    },
  ],
};

const setup = async (onTestFinished: (cleanup: () => Promise<void>) => void) => {
  const root = await mkdtemp(join(tmpdir(), "pipelab-connection-secrets-"));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const context = new PipelabContext({ userDataPath: root });
  await mkdir(context.getConfigPath(), { recursive: true });
  return context;
};

describe("connection secret protection", () => {
  beforeEach(() => {
    keyring.available = true;
    keyring.stored = undefined;
  });

  it("seals values at rest and restores them on load", async ({ onTestFinished }) => {
    const context = await setup(onTestFinished);
    await saveStrictConnections(context, config);

    const onDisk = await readFile(context.getConnectionsPath(), "utf8");
    expect(onDisk).not.toContain("super-secret-key");
    expect(onDisk).toContain("Itch");
    expect(keyring.stored?.byteLength).toBe(32);
    await expect(loadStrictConnections(context)).resolves.toEqual(config);
  });

  it("migrates existing plaintext connections on load", async ({ onTestFinished }) => {
    const context = await setup(onTestFinished);
    await writeFile(context.getConnectionsPath(), JSON.stringify(config));

    await expect(loadStrictConnections(context)).resolves.toEqual(config);
    expect(await readFile(context.getConnectionsPath(), "utf8")).not.toContain("super-secret-key");
    await expect(loadStrictConnections(context)).resolves.toEqual(config);
  });

  it("falls back to a user-only plaintext file without a keyring", async ({ onTestFinished }) => {
    keyring.available = false;
    const context = await setup(onTestFinished);
    await saveStrictConnections(context, config);

    expect(await readFile(context.getConnectionsPath(), "utf8")).toContain("super-secret-key");
    await expect(loadStrictConnections(context)).resolves.toEqual(config);
  });

  it("fails clearly, without rewriting, when sealed values lose their key", async ({
    onTestFinished,
  }) => {
    const context = await setup(onTestFinished);
    await saveStrictConnections(context, config);
    const sealed = await readFile(context.getConnectionsPath(), "utf8");
    keyring.stored = undefined;

    await expect(loadStrictConnections(context)).rejects.toThrow("credential store");
    await expect(readFile(context.getConnectionsPath(), "utf8")).resolves.toBe(sealed);
  });

  it("does not leave plaintext copies beside the connections file", async ({ onTestFinished }) => {
    const context = await setup(onTestFinished);
    await saveStrictConnections(context, config);
    await saveStrictConnections(context, config);
    for (const name of await readdir(context.getConfigPath()))
      expect(await readFile(join(context.getConfigPath(), name), "utf8")).not.toContain(
        "super-secret-key",
      );
  });
});
