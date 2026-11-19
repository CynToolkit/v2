import { describe, expect, it } from "vitest";
import {
  appSettingsMigrator,
  connectionsMigrator,
  defaultAppSettings,
  defaultFileRepo,
  fileRepoMigrations,
} from "./migrators";

describe("fileRepoMigrations", () => {
  it("creates the default project index", () => {
    expect(defaultFileRepo).toStrictEqual({
      version: "1.0.0",
      projects: [
        {
          id: "main",
          name: "Default project",
          description: "The initial default project",
        },
      ],
      workflows: [],
    });
  });

  it("returns the default for missing data and keeps current data as-is", async () => {
    await expect(fileRepoMigrations.migrate(undefined)).resolves.toStrictEqual(defaultFileRepo);
    const current = { ...defaultFileRepo, projects: [{ id: "p", name: "P", description: "" }] };
    await expect(fileRepoMigrations.migrate(current)).resolves.toStrictEqual(current);
  });
});

describe("appSettingsMigrator", () => {
  it("creates current defaults and keeps current settings unchanged", async () => {
    const settings = await appSettingsMigrator.migrate(undefined);
    expect(settings.version).toBe("1.0.0");
    expect(settings).toStrictEqual(defaultAppSettings);
    expect(settings).not.toHaveProperty("plugins");
    expect(await appSettingsMigrator.migrate(settings)).toEqual(settings);
  });

  it("rejects settings from an unknown version", async () => {
    await expect(
      appSettingsMigrator.migrate({ ...defaultAppSettings, version: "0.9.0" }),
    ).rejects.toThrow("not found in migrations");
  });
});

describe("connectionsMigrator", () => {
  it("initializes the current connection config", async () => {
    await expect(connectionsMigrator.migrate(undefined)).resolves.toStrictEqual({
      version: "1.0.0",
      connections: [],
    });
  });

  it("preserves saved integration IDs and credential fields", async () => {
    const connections = {
      version: "1.0.0" as const,
      connections: [
        {
          id: "steam-account",
          pluginName: "@pipelab/plugin-steam",
          integrationName: "Steam Account",
          name: "Release account",
          createdAt: "2026-01-01",
          isDefault: true,
          username: "test-account",
          password: "test-fixture-password",
        },
      ],
    };
    expect(await connectionsMigrator.migrate(connections)).toStrictEqual(connections);
  });
});
