import { mkdir, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createSandbox } from "@pipelab/test-utils";
import { DEFAULT_NODE_VERSION, DEFAULT_PNPM_VERSION } from "@pipelab/constants";
import { createReleaseConfig, type Events, type ReleaseConfig } from "@pipelab/shared";
import { PipelabContext, registerWorkflowHandlers, useAPI } from "@pipelab/core-node";
import { runWorkflowCommand } from "../../../src/commands/workflows";

const NOTIFICATION_PROVIDER = "@pipelab/plugin-notifications/webhook";
const SLACK_PROVIDER = "@pipelab/plugin-notifications/slack";

/** A local webhook that records what a finished run announced. */
const startWebhook = async (status = 200) => {
  const bodies: string[] = [];
  const server: Server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      bodies.push(body);
      response.statusCode = status;
      response.end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    bodies,
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/hook`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
};

const persist = async (
  sandbox: Awaited<ReturnType<typeof createSandbox>>,
  config: ReleaseConfig,
) => {
  const configRoot = join(sandbox.paths.userData, "config");
  await mkdir(join(configRoot, "workflows"), { recursive: true });
  await writeFile(
    join(configRoot, "projects.json"),
    JSON.stringify({
      version: "4.0.0",
      projects: [{ id: config.project, name: "Notify test", description: "" }],
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
  // The engine only checks that its bundled runtimes exist.
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
  return context;
};

describe("run notifications through the shared engine", () => {
  let sandbox: Awaited<ReturnType<typeof createSandbox>> | undefined;
  let webhook: Awaited<ReturnType<typeof startWebhook>> | undefined;

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await webhook?.close();
    webhook = undefined;
    await sandbox?.remove();
    sandbox = undefined;
  });

  const workflow = (sourcePath: string, patch: Partial<ReleaseConfig> = {}): ReleaseConfig => ({
    ...createReleaseConfig({
      id: "notify-workflow",
      project: "notify-project",
      name: "Notify workflow",
      source: { provider: "@pipelab/core/source/folder", config: { path: sourcePath } },
    }),
    notifications: [
      {
        id: "team",
        provider: NOTIFICATION_PROVIDER,
        enabled: true,
        config: {
          webhook: "hook",
          contentType: "application/json",
          template: '{"text":"{{workflow}} {{status}}"}',
        },
      },
    ],
    ...patch,
  });

  test("announces a finished run from the CLI and from the UI IPC path alike", async () => {
    sandbox = await createSandbox("workflow-notifications-parity");
    webhook = await startWebhook();
    const sourcePath = join(sandbox.path, "source");
    await mkdir(sourcePath, { recursive: true });
    await writeFile(join(sourcePath, "marker.txt"), "x");
    const config = workflow(sourcePath);
    const context = await persist(sandbox, config);

    await runWorkflowCommand(config.id, {
      userData: sandbox.paths.userData,
      skipPersistence: true,
      connection: [`hook.url=${webhook.url}`],
    });
    expect(webhook.bodies.map((body) => JSON.parse(body))).toEqual([
      { text: "Notify workflow success" },
    ]);

    registerWorkflowHandlers(context);
    const sent: Array<Events<"workflow:execute">> = [];
    await useAPI().handlers["workflow:execute"]?.(
      { sender: "notifications-test" },
      {
        value: {
          name: `workflows/${config.id}`,
          env: {},
          connectionOverrides: [
            { alias: "hook", field: "url", value: { kind: "literal", value: webhook.url } },
          ],
        },
        send: async (events) => {
          sent.push(events);
        },
      },
    );
    expect(sent.some((event) => event.type === "end" && event.data.type === "success")).toBe(true);
    expect(webhook.bodies.map((body) => JSON.parse(body))).toEqual([
      { text: "Notify workflow success" },
      { text: "Notify workflow success" },
    ]);
  });

  test("stays quiet when the matching global toggle is off", async () => {
    sandbox = await createSandbox("workflow-notifications-toggle");
    webhook = await startWebhook();
    const sourcePath = join(sandbox.path, "source");
    await mkdir(sourcePath, { recursive: true });
    const config = workflow(sourcePath, { settings: { notifications: { onSuccess: false } } });
    await persist(sandbox, config);

    await runWorkflowCommand(config.id, {
      userData: sandbox.paths.userData,
      skipPersistence: true,
      connection: [`hook.url=${webhook.url}`],
    });
    expect(webhook.bodies).toEqual([]);
  });

  test("a dead webhook never fails the run", async () => {
    sandbox = await createSandbox("workflow-notifications-dead");
    webhook = await startWebhook(500);
    const sourcePath = join(sandbox.path, "source");
    await mkdir(sourcePath, { recursive: true });
    const config = workflow(sourcePath);
    await persist(sandbox, config);

    await expect(
      runWorkflowCommand(config.id, {
        userData: sandbox.paths.userData,
        skipPersistence: true,
        connection: [`hook.url=${webhook.url}`],
      }),
    ).resolves.not.toThrow();
    // The first attempt and both retries reached the endpoint.
    expect(webhook.bodies).toHaveLength(3);
  });

  test("announces a failed run and does not leak a secret into the message", async () => {
    sandbox = await createSandbox("workflow-notifications-failure");
    webhook = await startWebhook();
    const config = workflow(join(sandbox.path, "missing-source-folder"), {
      notifications: [
        {
          id: "team",
          provider: NOTIFICATION_PROVIDER,
          enabled: true,
          config: {
            webhook: "hook",
            contentType: "text/plain",
            template: "{{status}}: {{error}}",
          },
        },
      ],
    });
    await persist(sandbox, config);

    await runWorkflowCommand(config.id, {
      userData: sandbox.paths.userData,
      skipPersistence: true,
      connection: [`hook.url=${webhook.url}`],
    }).catch(() => undefined);
    expect(webhook.bodies).toHaveLength(1);
    expect(webhook.bodies[0]).toMatch(/^failure: /);
    expect(webhook.bodies[0]).not.toContain(webhook.url);
  });

  test("fires on the destination a trigger names, not on one it does not", async () => {
    sandbox = await createSandbox("workflow-notifications-triggers");
    webhook = await startWebhook();
    const sourcePath = join(sandbox.path, "source");
    await mkdir(sourcePath, { recursive: true });
    await writeFile(join(sourcePath, "index.html"), "release");
    const target = (
      id: string,
      triggers: NonNullable<ReleaseConfig["notifications"]>[number]["triggers"],
    ) => ({
      id,
      provider: NOTIFICATION_PROVIDER,
      enabled: true,
      triggers,
      config: { webhook: "hook", contentType: "text/plain", template: `${id}: {{destinations}}` },
    });
    const config = workflow(sourcePath, {
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
              config: { outputDir: join(sandbox.path, "delivered") },
            },
          ],
        },
      ],
      notifications: [
        target("deployed", [{ on: "destination-completed", destinationId: "folder" }]),
        target("broke", [{ on: "destination-failed", destinationId: "folder" }]),
        target("failures-only", [{ on: "failure" }]),
      ],
    });
    await persist(sandbox, config);

    await runWorkflowCommand(config.id, {
      userData: sandbox.paths.userData,
      skipPersistence: true,
      connection: [`hook.url=${webhook.url}`],
    });
    expect(webhook.bodies).toHaveLength(1);
    expect(webhook.bodies[0]).toMatch(/^deployed: /);
  });

  test("announces a finished run to Slack as its JSON text payload", async () => {
    sandbox = await createSandbox("workflow-notifications-slack");
    webhook = await startWebhook();
    const sourcePath = join(sandbox.path, "source");
    await mkdir(sourcePath, { recursive: true });
    await writeFile(join(sourcePath, "marker.txt"), "x");
    const config = workflow(sourcePath, {
      notifications: [
        {
          id: "slack",
          provider: SLACK_PROVIDER,
          enabled: true,
          config: { webhook: "hook", template: "{{workflow}} <{{status}}>" },
        },
      ],
    });
    await persist(sandbox, config);

    await runWorkflowCommand(config.id, {
      userData: sandbox.paths.userData,
      skipPersistence: true,
      connection: [`hook.url=${webhook.url}`],
    });
    expect(webhook.bodies.map((body) => JSON.parse(body))).toEqual([
      { text: "Notify workflow <success>" },
    ]);
  });
});
