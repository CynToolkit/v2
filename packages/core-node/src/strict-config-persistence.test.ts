import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultConnections, defaultFileRepo } from "@pipelab/shared";
import { PipelabContext } from "./context";
import {
  loadStrictConnections,
  loadStrictProjects,
  saveStrictConnections,
  saveStrictProjects,
} from "./strict-config-persistence";

const setup = async () => {
  const root = await mkdtemp(join(tmpdir(), "pipelab-strict-config-"));
  const context = new PipelabContext({ userDataPath: root });
  await mkdir(context.getConfigPath(), { recursive: true });
  return context;
};

describe("strict config persistence", () => {
  it.each([
    ["malformed projects", { version: "1.0.0", projects: null }],
    ["unsupported older version", { version: "3.0.0", projects: [] }],
    ["unknown future version", { version: "5.0.0", projects: [] }],
  ])("recovers from %s by keeping a backup and starting a default index", async (_l, raw) => {
    const context = await setup();
    const original = JSON.stringify(raw);
    await writeFile(context.getProjectsPath(), original);

    await expect(loadStrictProjects(context)).resolves.toEqual(defaultFileRepo);
    const backup = (await readdir(context.getConfigPath())).find((name) =>
      name.startsWith("projects.json.invalid-"),
    );
    expect(backup).toBeDefined();
    await expect(readFile(join(context.getConfigPath(), backup ?? ""), "utf8")).resolves.toBe(
      original,
    );
    await expect(loadStrictProjects(context)).resolves.toEqual(defaultFileRepo);
  });

  it("recovers from corrupt connections by keeping a backup and starting from defaults", async () => {
    const context = await setup();
    await writeFile(context.getConnectionsPath(), "{broken");
    await expect(loadStrictConnections(context)).resolves.toEqual(defaultConnections);
    const backup = (await readdir(context.getConfigPath())).find((name) =>
      name.startsWith("connections.json.invalid-"),
    );
    await expect(readFile(join(context.getConfigPath(), backup ?? ""), "utf8")).resolves.toBe(
      "{broken",
    );
  });

  it.skipIf(process.platform === "win32")(
    "restricts permissions when replacing a connections file",
    async ({ onTestFinished }) => {
      const context = await setup();
      onTestFinished(() => rm(context.userDataPath, { recursive: true, force: true }));
      await writeFile(context.getConnectionsPath(), JSON.stringify(defaultConnections), {
        mode: 0o644,
      });

      await saveStrictConnections(context, defaultConnections);

      expect((await stat(context.getConnectionsPath())).mode & 0o777).toBe(0o600);
    },
  );

  it("re-reads a connections file created by another process during initialization", async () => {
    const context = await setup();
    const competingConfig = {
      version: "1.0.0",
      connections: [
        {
          id: "racing-connection",
          pluginName: "provider",
          name: "Racing connection",
          createdAt: "2026-09-23T00:00:00.000Z",
          isDefault: true,
        },
      ],
    };
    const getConnectionsPath = context.getConnectionsPath.bind(context);
    let pathRequests = 0;
    context.getConnectionsPath = () => {
      const path = getConnectionsPath();
      pathRequests += 1;
      if (pathRequests === 2) writeFileSync(path, JSON.stringify(competingConfig), "utf8");
      return path;
    };

    await expect(loadStrictConnections(context)).resolves.toEqual(competingConfig);
    await expect(readFile(getConnectionsPath(), "utf8")).resolves.toBe(
      JSON.stringify(competingConfig),
    );
  });

  it("recovers from malformed project JSON and keeps the original", async () => {
    const context = await setup();
    await writeFile(context.getProjectsPath(), "{broken");
    await expect(loadStrictProjects(context)).resolves.toEqual(defaultFileRepo);
    const backup = (await readdir(context.getConfigPath())).find((name) =>
      name.startsWith("projects.json.invalid-"),
    );
    await expect(readFile(join(context.getConfigPath(), backup ?? ""), "utf8")).resolves.toBe(
      "{broken",
    );
  });

  it("prevents deleting a project referenced by a workflow", async () => {
    const context = await setup();
    const workflow = {
      id: "w1",
      project: "p1",
      lastModified: "2026-01-01",
      type: "internal-workflow" as const,
      configName: "workflows/w1",
    };
    await writeFile(
      context.getProjectsPath(),
      JSON.stringify({
        version: "1.0.0",
        projects: [{ id: "p1", name: "Project", description: "" }],
        workflows: [workflow],
      }),
    );
    await expect(
      saveStrictProjects(context, { version: "1.0.0", projects: [], workflows: [] }),
    ).rejects.toThrow("cannot be deleted");
  });

  it("prevents generic project saves from mutating workflow index entries", async () => {
    const context = await setup();
    const workflow = {
      id: "w1",
      project: "p1",
      lastModified: "2026-01-01",
      type: "internal-workflow" as const,
      configName: "workflows/w1",
    };
    await writeFile(
      context.getProjectsPath(),
      JSON.stringify({
        version: "1.0.0",
        projects: [{ id: "p1", name: "Project", description: "" }],
        workflows: [workflow],
      }),
    );
    await expect(
      saveStrictProjects(context, {
        version: "1.0.0",
        projects: [{ id: "p1", name: "Renamed", description: "" }],
        workflows: [{ ...workflow, lastModified: "2026-01-02" }],
      }),
    ).rejects.toThrow("only be changed through ReleasePersistence");
    await expect(
      saveStrictProjects(context, {
        version: "1.0.0",
        projects: [{ id: "p1", name: "Renamed", description: "" }],
        workflows: [workflow],
      }),
    ).resolves.toBeUndefined();
  });
});
