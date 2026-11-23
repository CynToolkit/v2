import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createSandbox } from "@pipelab/test-utils";
import { DEFAULT_NODE_VERSION, DEFAULT_PNPM_VERSION } from "@pipelab/constants";
import { createReleaseConfig, type ReleaseConfig } from "@pipelab/shared";
import { PipelabContext } from "@pipelab/core-node";
import { runWorkflowCommand } from "../../../src/commands/workflows";

const prompts = vi.hoisted(() => ({ answers: [] as unknown[] }));
vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  note: vi.fn(),
  isCancel: () => false,
  log: { error: vi.fn() },
  select: vi.fn(async () => prompts.answers.shift()),
  multiselect: vi.fn(async () => prompts.answers.shift()),
  group: vi.fn(async () => ({ theme: "dark", locale: "en-US" })),
  password: vi.fn(),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
}));

type Sandbox = Awaited<ReturnType<typeof createSandbox>>;

/** A workflow whose only folder destination points at a file, so delivery fails. */
const persistFailingDeploymentWorkflow = async (sandbox: Sandbox): Promise<ReleaseConfig> => {
  const sourcePath = join(sandbox.path, "source");
  await mkdir(sourcePath, { recursive: true });
  await writeFile(join(sourcePath, "marker.txt"), "x");
  const blocker = join(sandbox.path, "not-a-directory");
  await writeFile(blocker, "file");
  const config: ReleaseConfig = {
    ...createReleaseConfig({
      id: "failing-deploy",
      project: "exit-project",
      name: "Failing deploy",
      source: { provider: "@pipelab/core/source/folder", config: { path: sourcePath } },
    }),
    builds: [
      {
        id: "bundle",
        type: "bundle",
        engine: "@pipelab/core/bundle",
        inputs: [{ source: true }],
        config: {},
        targets: [{ id: "zip", config: {} }],
      },
    ],
    destinations: [
      {
        id: "folder",
        provider: "@pipelab/core/destination/folder",
        enabled: true,
        config: {},
        slots: [
          {
            id: "slot",
            enabled: true,
            input: { buildId: "bundle", targetId: "zip" },
            config: { outputDir: join(blocker, "delivered") },
          },
        ],
      },
    ],
  };
  const configRoot = join(sandbox.paths.userData, "config");
  await mkdir(join(configRoot, "workflows"), { recursive: true });
  await writeFile(
    join(configRoot, "projects.json"),
    JSON.stringify({
      version: "1.0.0",
      projects: [{ id: config.project, name: "Exit test", description: "" }],
      workflows: [
        {
          id: config.id,
          project: config.project,
          lastModified: "2026-01-01T00:00:00.000Z",
          type: "internal-workflow",
          configName: `workflows/${config.id}`,
        },
      ],
    }),
  );
  await writeFile(join(configRoot, "workflows", `${config.id}.json`), JSON.stringify(config));
  const context = new PipelabContext({ userDataPath: sandbox.paths.userData });
  const nodePath = join(
    context.getThirdPartyPath("node", DEFAULT_NODE_VERSION),
    process.platform === "win32" ? "node.exe" : "bin/node",
  );
  const pnpmPath = join(context.getPackagesPath("pnpm", DEFAULT_PNPM_VERSION), "bin/pnpm.cjs");
  await mkdir(dirname(nodePath), { recursive: true });
  await mkdir(dirname(pnpmPath), { recursive: true });
  await writeFile(nodePath, "fixture runtime");
  await writeFile(pnpmPath, "fixture runtime");
  return config;
};

describe("CLI exit status for automation", () => {
  let sandbox: Sandbox | undefined;

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
    prompts.answers.length = 0;
    await sandbox?.remove();
    sandbox = undefined;
  });

  describe("workflow run", () => {
    const run = async (extra: Record<string, unknown>) => {
      sandbox = await createSandbox("cli-exit-status-run");
      const config = await persistFailingDeploymentWorkflow(sandbox);
      return runWorkflowCommand(config.id, {
        userData: sandbox.paths.userData,
        skipPersistence: true,
        ...extra,
      });
    };

    test("a failed deployment rejects by default", async () => {
      await expect(run({})).rejects.toThrow("Workflow completed with errors");
    });

    test("--fail-on-error stays accepted and behaves the same", async () => {
      await expect(run({ failOnError: true })).rejects.toThrow("Workflow completed with errors");
    });

    test("--no-fail-on-error opts out of the nonzero exit", async () => {
      await expect(run({ failOnError: false })).resolves.toBeUndefined();
    });
  });

  describe("setup", () => {
    const runSetup = async (authType: string, integrations: string[]) => {
      sandbox = await createSandbox("cli-exit-status-setup");
      prompts.answers.push(authType, integrations);
      const { setupCommand } = await import("../../../src/commands/setup");
      await setupCommand({ userData: sandbox.paths.userData });
    };

    test("unimplemented integrations are reported and exit nonzero", async () => {
      await runSetup("skip", ["path", "telemetry"]);
      expect(process.exitCode).toBe(1);
      const { log } = await import("@clack/prompts");
      const message = vi.mocked(log.error).mock.calls.flat().join("\n");
      expect(message).toContain("not implemented");
      expect(message).toContain("PATH");
      expect(message).toContain("telemetry");
    });

    test("selecting nothing unimplemented still succeeds", async () => {
      await runSetup("skip", []);
      expect(process.exitCode).toBeUndefined();
    });
  });
});
