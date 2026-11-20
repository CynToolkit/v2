import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { NotificationSenderRegistry, ReleaseNotificationConfig } from "@pipelab/shared";
import {
  DISCORD_NOTIFICATION_ID,
  EMAIL_ENABLED,
  emailSender,
  EMAIL_NOTIFICATION_ID,
  SLACK_NOTIFICATION_ID,
  WEBHOOK_NOTIFICATION_ID,
  emailNotification,
  slackNotification,
  testEmailConnection,
  discordNotification,
  provider,
  testWebhookConnection,
  webhookNotification,
} from "./index";
import { parseWebhookUrl } from "./send";

interface Received {
  method?: string;
  contentType?: string;
  body: string;
}

let server: Server;
let received: Received[];
let status = 200;
let baseUrl = "";

beforeEach(async () => {
  received = [];
  status = 200;
  server = createServer((request: IncomingMessage, response) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      received.push({
        method: request.method,
        contentType: request.headers["content-type"],
        body,
      });
      response.statusCode = status;
      response.end("secret-in-body");
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/hook/token-123`;
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
});

const senders: NotificationSenderRegistry = provider.notificationSenders ?? {};
const sender = (id: string) => senders[id]!;
const identity = (value: string) => value;

describe("notification providers", () => {
  it("contributes Discord and generic webhook targets with a sender each", () => {
    const ids = [DISCORD_NOTIFICATION_ID, SLACK_NOTIFICATION_ID, WEBHOOK_NOTIFICATION_ID];
    expect(provider.release?.notifications?.map((definition) => definition.id)).toEqual(ids);
    expect(Object.keys(provider.notificationSenders ?? {}).toSorted()).toEqual([...ids].toSorted());
  });

  it("posts a Discord message as JSON and truncates it to Discord's limit", async () => {
    await sender(DISCORD_NOTIFICATION_ID)({
      values: { url: baseUrl },
      message: "x".repeat(2500),
      render: () => "",
      renderTemplate: (text: string) => text,
    });
    expect(received).toHaveLength(1);
    expect(received[0]!.method).toBe("POST");
    expect(received[0]!.contentType).toBe("application/json");
    const { content } = JSON.parse(received[0]!.body) as { content: string };
    expect(content).toHaveLength(2000);
    expect(content.endsWith("…")).toBe(true);
  });

  it("posts the generic template as the body, JSON-escaping values for JSON content", async () => {
    await sender(WEBHOOK_NOTIFICATION_ID)({
      values: { url: baseUrl, contentType: "application/json" },
      message: "",
      render: (escape = identity) => `{"error":"${escape('say "hi"')}"}`,
      renderTemplate: (text: string) => text,
    });
    expect(JSON.parse(received[0]!.body)).toEqual({ error: 'say "hi"' });

    await sender(WEBHOOK_NOTIFICATION_ID)({
      values: { url: baseUrl, contentType: "text/plain" },
      message: "",
      render: (escape = identity) => escape('say "hi"'),
      renderTemplate: (text: string) => text,
    });
    expect(received[1]!.contentType).toBe("text/plain");
    expect(received[1]!.body).toBe('say "hi"');
  });

  it("fails without revealing the URL or the response body", async () => {
    status = 500;
    const failure = await sender(DISCORD_NOTIFICATION_ID)({
      values: { url: baseUrl },
      message: "hello",
      render: () => "",
      renderTemplate: (text: string) => text,
    }).catch((error: Error) => error.message);
    expect(failure).toBe("The webhook answered HTTP 500.");
    expect(failure).not.toContain("token-123");
    expect(failure).not.toContain("secret-in-body");

    const unreachable = await sender(DISCORD_NOTIFICATION_ID)({
      values: { url: "http://127.0.0.1:1/token-456" },
      message: "hello",
      render: () => "",
      renderTemplate: (text: string) => text,
    }).catch((error: Error) => error.message);
    expect(unreachable).toBe("The webhook could not be reached.");
  });

  it("accepts https and loopback http only", () => {
    expect(parseWebhookUrl("https://discord.com/api/webhooks/1/x").protocol).toBe("https:");
    expect(parseWebhookUrl("http://localhost:8080/x").hostname).toBe("localhost");
    expect(() => parseWebhookUrl("http://example.com/x")).toThrow(/https/);
    expect(() => parseWebhookUrl("ftp://example.com/x")).toThrow(/https/);
    expect(() => parseWebhookUrl("not a url")).toThrow(/valid URL/);
  });

  it("tests a saved connection by sending a message", async () => {
    await expect(
      testWebhookConnection({ values: { url: baseUrl }, services: undefined }),
    ).resolves.toEqual({ status: "verified" });
    expect(received).toHaveLength(1);
    status = 404;
    await expect(
      testWebhookConnection({ values: { url: baseUrl }, services: undefined }),
    ).resolves.toEqual({ status: "failed", message: "The webhook answered HTTP 404." });
    await expect(
      testWebhookConnection({ values: { url: "http://example.com" }, services: undefined }),
    ).resolves.toMatchObject({ status: "failed" });
  });
});

describe("notification target validation", () => {
  const target = (
    definition: typeof discordNotification,
    config: Record<string, unknown>,
  ): ReleaseNotificationConfig => ({
    id: "n1",
    provider: definition.id,
    enabled: true,
    config,
  });

  it("requires a connection and a template and rejects unknown variables", () => {
    expect(
      discordNotification
        .validate(target(discordNotification, { webhook: "", template: "" }))
        .map((issue) => issue.code),
    ).toEqual(["notifications.webhook.required", "notifications.template.required"]);
    expect(
      webhookNotification
        .validate(target(webhookNotification, { webhook: "hook", template: "{{oops}}" }))
        .map((issue) => issue.code),
    ).toEqual(["notifications.template.unknown-variable"]);
    expect(
      discordNotification.validate(
        target(discordNotification, {
          ...discordNotification.createDefaultConfig(),
          webhook: "hook",
        }),
      ),
    ).toEqual([]);
  });

  it("ships default templates that validate", () => {
    for (const definition of [discordNotification, webhookNotification])
      expect(
        definition.validate(
          target(definition, { ...definition.createDefaultConfig(), webhook: "hook" }),
        ),
      ).toEqual([]);
  });

  it("posts a Slack message with substituted values escaped, not the template around them", async () => {
    await sender(SLACK_NOTIFICATION_ID)({
      values: { url: baseUrl },
      message: "",
      render: (escape = identity) => `<https://x.test|build> ${escape("a < b & c")}`,
      renderTemplate: (text: string) => text,
    });
    expect(received[0]!.contentType).toBe("application/json");
    expect(JSON.parse(received[0]!.body)).toEqual({
      text: "<https://x.test|build> a &lt; b &amp; c",
    });
  });

  it("refuses a URL that is not a Slack webhook, without echoing it", async () => {
    const failure = await sender(SLACK_NOTIFICATION_ID)({
      values: { url: "https://example.com/hook/token-789" },
      message: "",
      render: () => "hello",
      renderTemplate: (text: string) => text,
    }).catch((error: Error) => error.message);
    expect(failure).toContain("not a Slack webhook");
    expect(failure).not.toContain("token-789");
  });

  it("keeps email switched off: no target, sender or connection type is offered", () => {
    expect(EMAIL_ENABLED).toBe(false);
    expect(provider.notificationSenders?.[EMAIL_NOTIFICATION_ID]).toBeUndefined();
    expect(provider.integrations?.map((integration) => integration.name)).toEqual([
      "Notification webhook",
    ]);
  });

  it("validates the email target's recipients, subject and account", () => {
    const issues = (config: Record<string, unknown>) =>
      emailNotification
        .validate({ id: "e", provider: EMAIL_NOTIFICATION_ID, enabled: true, config })
        .map((issue) => issue.path);
    expect(issues(emailNotification.createDefaultConfig())).toEqual([
      "config.account",
      "config.to",
    ]);
    expect(issues({ account: "mail", to: "a@x.com, nope", subject: "s", template: "m" })).toEqual([
      "config.to",
    ]);
    expect(
      issues({ account: "mail", to: "a@x.com", subject: "{{typo}}", template: "{{workflow}}" }),
    ).toEqual(["config.subject"]);
    expect(issues({ account: "mail", to: "a@x.com;b@y.com", subject: "s", template: "m" })).toEqual(
      [],
    );
    expect(slackNotification.createDefaultConfig()).toMatchObject({ webhook: "" });
  });

  describe("email through Resend", () => {
    const realFetch = globalThis.fetch;
    afterEach(() => {
      globalThis.fetch = realFetch;
    });
    const values = {
      apiKey: "re_secret_key",
      from: "Pipelab <builds@studio.com>",
      to: "a@studio.com, b@studio.com",
      subject: "{{workflow}} {{status}}",
    };
    const send = () =>
      emailSender({
        values,
        message: "Body text",
        render: () => "Body text",
        renderTemplate: (text: string) =>
          text.replace("{{workflow}}", "Game").replace("{{status}}", "success"),
      });

    it("posts one message to every recipient with the key as a bearer token", async () => {
      const calls: Array<{ url: string; init: RequestInit }> = [];
      globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
        calls.push({ url: String(url), init: init ?? {} });
        return new Response(JSON.stringify({ id: "1" }), { status: 200 });
      }) as typeof fetch;
      await send();
      expect(calls).toHaveLength(1);
      expect(calls[0]!.url).toBe("https://api.resend.com/emails");
      expect((calls[0]!.init.headers as Record<string, string>).Authorization).toBe(
        "Bearer re_secret_key",
      );
      expect(JSON.parse(String(calls[0]!.init.body))).toEqual({
        from: "Pipelab <builds@studio.com>",
        to: ["a@studio.com", "b@studio.com"],
        subject: "Game success",
        text: "Body text",
      });
    });

    it("explains a rejection without the key or the response body", async () => {
      globalThis.fetch = (async () =>
        new Response("re_secret_key leaked", { status: 403 })) as typeof fetch;
      const failure = await send().catch((error: Error) => error.message);
      expect(failure).toBe("Resend rejected the API key (HTTP 403).");
      expect(failure).not.toContain("re_secret_key");
      globalThis.fetch = (async () => new Response("", { status: 500 })) as typeof fetch;
      await expect(send()).rejects.toThrow("Resend answered HTTP 500.");
    });

    it("checks an account by shape and says it cannot go further", async () => {
      const test = (apiKey: string, from: string) =>
        testEmailConnection({ values: { apiKey, from }, services: undefined });
      expect(await test("nope", "a@x.com")).toMatchObject({ status: "failed" });
      expect(await test("re_x", "not an address")).toMatchObject({ status: "failed" });
      expect(await test("re_x", "Pipelab <a@x.com>")).toMatchObject({ status: "unverifiable" });
    });
  });
});
