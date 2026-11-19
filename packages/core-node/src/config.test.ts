import { describe, test, expect, beforeEach, vi } from "vitest";
import { setupConfigFile, setupProjectsConfigFile } from "./config";
import { FileRepo } from "@pipelab/shared";
import { PipelabContext } from "./context";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { vol } from "memfs";

// Mock the node:fs and node:fs/promises modules to use memfs
vi.mock("node:fs", async () => {
  const memfs = await import("memfs");
  return {
    ...memfs.fs,
    default: memfs.fs,
  };
});

vi.mock("node:fs/promises", async () => {
  const memfs = await import("memfs");
  return {
    ...memfs.fs.promises,
    default: memfs.fs.promises,
  };
});

describe("setupConfigFile & Backup Creation", () => {
  let tempDir: string;
  let context: PipelabContext;

  beforeEach(() => {
    vol.reset();
    tempDir = "/tmp/pipelab-test-config";
    context = new PipelabContext({ userDataPath: tempDir });
  });

  test("should create default config file if missing on setup", async () => {
    const configDir = context.getConfigPath();
    const projectsFilePath = context.getProjectsPath();

    expect(existsSync(projectsFilePath)).toBe(false);

    // Initialize setupConfigFile
    await setupProjectsConfigFile(context);

    // Should create file with default value
    expect(existsSync(projectsFilePath)).toBe(true);
    const content = JSON.parse(await fs.readFile(projectsFilePath, "utf8"));
    expect(content.version).toBe("1.0.0");
    expect(content.projects).toHaveLength(1);
    expect(content).not.toHaveProperty("pipelines");
  });

  test("should fallback to default config and preserve corrupted file if parsing fails", async () => {
    const configDir = context.getConfigPath();
    await fs.mkdir(configDir, { recursive: true });
    const projectsFilePath = context.getProjectsPath();

    await fs.writeFile(projectsFilePath, "{ corrupted json... }");

    const configInstance = await setupProjectsConfigFile(context);
    const config = await configInstance.getConfig();

    expect(config.version).toBe("1.0.0");
    expect(config.projects).toHaveLength(1);
    expect(config).not.toHaveProperty("pipelines");

    // Verify a timestamped corrupted backup file exists
    const files = await fs.readdir(configDir);
    const corruptedFile = files.find(
      (f) => f.startsWith("projects.corrupted.") && f.endsWith(".json"),
    );
    expect(corruptedFile).toBeDefined();
    const corruptedContent = await fs.readFile(path.join(configDir, corruptedFile!), "utf8");
    expect(corruptedContent).toBe("{ corrupted json... }");
  });

  test("should fallback to default config and preserve file if migration throws", async () => {
    const configDir = context.getConfigPath();
    await fs.mkdir(configDir, { recursive: true });
    const projectsFilePath = context.getProjectsPath();

    const customMigrator = {
      defaultValue: { version: "2.0.0", projects: [] } as any,
      migrate: async () => {
        throw new Error("Migration failed!");
      },
    };

    await fs.writeFile(projectsFilePath, JSON.stringify({ version: "1.0.0", invalidData: true }));

    const configInstance = await setupConfigFile<any>(context.getProjectsPath(), {
      context,
      migrator: customMigrator,
    });
    const config = await configInstance.getConfig();

    expect(config.version).toBe("2.0.0");

    // Verify a timestamped corrupted backup file exists
    const files = await fs.readdir(configDir);
    const corruptedFile = files.find(
      (f) => f.startsWith("projects.corrupted.") && f.endsWith(".json"),
    );
    expect(corruptedFile).toBeDefined();
    const corruptedContent = JSON.parse(
      await fs.readFile(path.join(configDir, corruptedFile!), "utf8"),
    );
    expect(corruptedContent.invalidData).toBe(true);
  });

  test("should save config to disk via setConfig", async () => {
    const configInstance = await setupProjectsConfigFile(context);
    const initialConfig = await configInstance.getConfig();

    const newConfig: FileRepo = {
      ...initialConfig,
      projects: [{ ...initialConfig.projects[0], description: "Updated project" }],
    };

    const success = await configInstance.setConfig(newConfig);
    expect(success).toBe(true);

    const savedContent = JSON.parse(await fs.readFile(context.getProjectsPath(), "utf8"));
    expect(savedContent.projects[0].description).toBe("Updated project");
    expect(savedContent).not.toHaveProperty("pipelines");
  });
});
