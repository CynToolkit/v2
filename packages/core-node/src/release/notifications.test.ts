import { describe, expect, it, vi } from "vitest";
import type {
  NotificationSender,
  ReleaseConfig,
  ReleaseNotificationEvent,
  ReleaseRegistry,
} from "@pipelab/shared";
import { dispatchRunNotifications, type DispatchRunNotificationsInput } from "./notifications";

const event: ReleaseNotificationEvent = {
  workflow: "My game",
  status: "success",
  version: "1.0.0",
  durationMs: 1000,
  destinations: [],
};

const registry = {
  sources: [],
  producers: [],
  destinations: [],
  notifications: [
    {
      id: "n/hook",
      label: "Hook",
      fields: [{ key: "webhook", type: "connection", label: "Webhook", integration: "n" }],
      createDefaultConfig: () => ({}),
      validate: () => [],
    },
  ],
} as unknown as ReleaseRegistry;

const config = (patch: Partial<ReleaseConfig> = {}): ReleaseConfig =>
  ({
    version: "3.1.0",
    id: "wf",
    project: "p",
    name: "My game",
    source: { provider: "s", config: {} },
    builds: [],
    destinations: [],
    notifications: [
      {
        id: "t1",
        provider: "n/hook",
        name: "Team",
        enabled: true,
        config: { webhook: "hook", template: "{{workflow}} {{status}}" },
      },
    ],
    ...patch,
  }) as ReleaseConfig;

const setup = (send: NotificationSender, input: Partial<DispatchRunNotificationsInput> = {}) => {
  const warnings: string[] = [];
  const base: DispatchRunNotificationsInput = {
    config: config(),
    registry,
    providers: [{ notificationSenders: { "n/hook": send } }],
    connectionValues: { hook: { url: "https://secret.example/abc" } },
    outcome: "success",
    event,
    redactString: (value) => value.split("https://secret.example/abc").join("[REDACTED]"),
    warn: (message) => warnings.push(message),
    retryDelaysMs: [0, 0],
    sleep: async () => undefined,
  };
  return { warnings, run: () => dispatchRunNotifications({ ...base, ...input }) };
};

describe("dispatchRunNotifications", () => {
  it("renders the template and sends it with the connection's values", async () => {
    const send = vi.fn<NotificationSender>().mockResolvedValue(undefined);
    await setup(send).run();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]![0]).toMatchObject({
      message: "My game success",
      values: { url: "https://secret.example/abc", webhook: "hook" },
    });
  });

  it("lets a sender render other text, such as an email subject, redacted like the message", async () => {
    const send = vi.fn<NotificationSender>().mockResolvedValue(undefined);
    await setup(send).run();
    const { renderTemplate } = send.mock.calls[0]![0];
    expect(renderTemplate("{{status}} {{workflow}}")).toBe("success My game");
    expect(renderTemplate('{"w":"{{workflow}}"}', (value) => value.toUpperCase())).toBe(
      '{"w":"MY GAME"}',
    );
  });

  it("does nothing for a cancelled run, a disabled target, or a switched-off outcome", async () => {
    const send = vi.fn<NotificationSender>().mockResolvedValue(undefined);
    await setup(send, { outcome: "cancelled" }).run();
    await setup(send, {
      config: config({
        notifications: [{ ...config().notifications![0]!, enabled: false }],
      }),
    }).run();
    await setup(send, {
      config: config({ settings: { notifications: { onSuccess: false } } }),
    }).run();
    expect(send).not.toHaveBeenCalled();
    await setup(send, {
      outcome: "failure",
      config: config({ settings: { notifications: { onSuccess: false } } }),
    }).run();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("sends once per target, only when one of its triggers fires", async () => {
    const send = vi.fn<NotificationSender>().mockResolvedValue(undefined);
    const withTriggers = (
      triggers: NonNullable<ReleaseConfig["notifications"]>[number]["triggers"],
    ) => config({ notifications: [{ ...config().notifications![0]!, triggers }] });
    await setup(send, { config: withTriggers([{ on: "failure" }]) }).run();
    expect(send).not.toHaveBeenCalled();
    await setup(send, {
      config: withTriggers([
        { on: "failure" },
        { on: "destination-completed", destinationId: "steam" },
      ]),
      event: {
        ...event,
        destinations: [{ destinationId: "steam", name: "Steam", status: "completed" }],
      },
    }).run();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("retries, then warns without throwing and without leaking the secret", async () => {
    const send = vi
      .fn<NotificationSender>()
      .mockRejectedValue(new Error("down: https://secret.example/abc"));
    const { run, warnings } = setup(send);
    await expect(run()).resolves.toBeUndefined();
    expect(send).toHaveBeenCalledTimes(3);
    expect(warnings).toEqual(["Notification 'Team' was not delivered: down: [REDACTED]"]);
  });

  it("stops retrying after a success", async () => {
    const send = vi
      .fn<NotificationSender>()
      .mockRejectedValueOnce(new Error("blip"))
      .mockResolvedValue(undefined);
    const { run, warnings } = setup(send);
    await run();
    expect(send).toHaveBeenCalledTimes(2);
    expect(warnings).toEqual([]);
  });

  it("warns when the connection has no values or the provider is unknown", async () => {
    const send = vi.fn<NotificationSender>();
    const missing = setup(send, { connectionValues: {} });
    await missing.run();
    expect(missing.warnings[0]).toContain("no Connection values were provided for 'hook'");
    const unknown = setup(send, { providers: [] });
    await unknown.run();
    expect(unknown.warnings[0]).toContain("unknown notification provider");
    expect(send).not.toHaveBeenCalled();
  });

  it("redacts secrets from the rendered message", async () => {
    const send = vi.fn<NotificationSender>().mockResolvedValue(undefined);
    await setup(send, {
      event: { ...event, workflow: "leak https://secret.example/abc" },
    }).run();
    expect(send.mock.calls[0]![0].message).toBe("leak [REDACTED] success");
  });
});
