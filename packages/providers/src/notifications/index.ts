import { createProviderDefinition } from "@pipelab/shared";
import type {
  ConnectionTestContext,
  IntegrationDefinition,
  NotificationSender,
  PreflightResult,
  ReleaseNotificationDefinition,
  ReleaseNotificationConfig,
  ValidationIssue,
} from "@pipelab/shared";
import { unknownNotificationTemplateVariables } from "@pipelab/shared";
import {
  isDiscordWebhook,
  isValidSender,
  DISCORD_MESSAGE_LIMIT,
  parseRecipients,
  parseWebhookUrl,
  sendDiscord,
  sendEmail,
  sendGeneric,
  sendSlack,
} from "./send";
import { discordLogo } from "./icons";

export const PROVIDER_ID = "@pipelab/plugin-notifications";
export const DISCORD_NOTIFICATION_ID = `${PROVIDER_ID}/discord`;
export const WEBHOOK_NOTIFICATION_ID = `${PROVIDER_ID}/webhook`;
export const SLACK_NOTIFICATION_ID = `${PROVIDER_ID}/slack`;
export const EMAIL_NOTIFICATION_ID = `${PROVIDER_ID}/email`;

/**
 * Email is built and tested but switched off for now: nothing below registers it, so no target,
 * connection type or sender is offered. Set this to true to ship it.
 */
export const EMAIL_ENABLED = false;

/** Connection integrations, matched by name so a Discord target never offers an email account. */
const WEBHOOK_INTEGRATION = "Notification webhook";
const EMAIL_INTEGRATION = "Email (Resend)";

const DEFAULT_TEMPLATE =
  "{{workflow}} {{version}}: {{status}} in {{duration}}\n{{destinations}}\n{{error}}";
const DEFAULT_JSON_TEMPLATE =
  '{"workflow":"{{workflow}}","version":"{{version}}","status":"{{status}}","duration":"{{duration}}","destinations":"{{destinations}}","error":"{{error}}"}';

const TEMPLATE_HELP =
  "Variables: {{workflow}}, {{status}}, {{duration}}, {{version}}, {{destinations}} (results and URLs), {{error}}.";

const connectionField = {
  key: "webhook",
  type: "connection" as const,
  integration: WEBHOOK_INTEGRATION,
  label: "Webhook",
  description: "The saved webhook URL. It is a secret, so it is never stored in the workflow file.",
  required: true,
};

const validateTarget = (config: ReleaseNotificationConfig): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (!String(config.config.webhook ?? "").trim())
    issues.push({
      code: "notifications.webhook.required",
      message: "A webhook connection is required.",
      severity: "error",
      path: "config.webhook",
    });
  const template = String(config.config.template ?? "");
  if (!template.trim())
    issues.push({
      code: "notifications.template.required",
      message: "A message template is required.",
      severity: "error",
      path: "config.template",
    });
  const unknown = unknownNotificationTemplateVariables(template);
  if (unknown.length)
    issues.push({
      code: "notifications.template.unknown-variable",
      message: `Unknown template variable${unknown.length > 1 ? "s" : ""}: ${unknown.map((name) => `{{${name}}}`).join(", ")}.`,
      severity: "error",
      path: "config.template",
    });
  return issues;
};

export const discordNotification: ReleaseNotificationDefinition = {
  id: DISCORD_NOTIFICATION_ID,
  label: "Discord",
  description: "Post the result of a run to a Discord channel through a webhook.",
  icon: { type: "image", image: discordLogo },
  fields: [
    connectionField,
    {
      key: "template",
      type: "text",
      label: "Message",
      description: TEMPLATE_HELP,
      required: true,
      maxLength: DISCORD_MESSAGE_LIMIT,
    },
  ],
  createDefaultConfig: () => ({ webhook: "", template: DEFAULT_TEMPLATE }),
  validate: validateTarget,
};

export const webhookNotification: ReleaseNotificationDefinition = {
  id: WEBHOOK_NOTIFICATION_ID,
  label: "Generic webhook",
  description: "POST the rendered template to any HTTPS endpoint.",
  icon: { type: "icon", icon: "mdi-webhook" },
  fields: [
    connectionField,
    {
      key: "contentType",
      type: "text",
      label: "Content type",
      description: "Sent as the Content-Type header. JSON bodies get JSON-escaped values.",
      placeholder: "application/json",
      options: [
        { value: "application/json", label: "application/json" },
        { value: "text/plain", label: "text/plain" },
      ],
    },
    {
      key: "template",
      type: "text",
      label: "Body",
      description: `The request body, rendered. ${TEMPLATE_HELP}`,
      required: true,
    },
  ],
  createDefaultConfig: () => ({
    webhook: "",
    contentType: "application/json",
    template: DEFAULT_JSON_TEMPLATE,
  }),
  validate: validateTarget,
};

export const slackNotification: ReleaseNotificationDefinition = {
  id: SLACK_NOTIFICATION_ID,
  label: "Slack",
  description: "Post the result of a run to a Slack channel through an incoming webhook.",
  icon: { type: "icon", icon: "mdi-slack" },
  fields: [
    connectionField,
    {
      key: "template",
      type: "text",
      label: "Message",
      description: TEMPLATE_HELP,
      required: true,
    },
  ],
  createDefaultConfig: () => ({ webhook: "", template: DEFAULT_TEMPLATE }),
  validate: validateTarget,
};

const emailConnectionField = {
  key: "account",
  type: "connection" as const,
  integration: EMAIL_INTEGRATION,
  label: "Email account",
  description: "The saved Resend API key and sender. The key is never stored in the workflow file.",
  required: true,
};

const validateEmail = (config: ReleaseNotificationConfig): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const add = (code: string, message: string, path: string) =>
    issues.push({ code: `notifications.${code}`, message, severity: "error", path });
  if (!String(config.config.account ?? "").trim())
    add("account.required", "An email account connection is required.", "config.account");
  try {
    parseRecipients(String(config.config.to ?? ""));
  } catch (error) {
    add("to.invalid", error instanceof Error ? error.message : String(error), "config.to");
  }
  for (const [key, label] of [
    ["subject", "A subject"],
    ["template", "A message template"],
  ] as const) {
    const text = String(config.config[key] ?? "");
    if (!text.trim()) add(`${key}.required`, `${label} is required.`, `config.${key}`);
    const unknown = unknownNotificationTemplateVariables(text);
    if (unknown.length)
      add(
        `${key}.unknown-variable`,
        `Unknown template variable${unknown.length > 1 ? "s" : ""}: ${unknown.map((name) => `{{${name}}}`).join(", ")}.`,
        `config.${key}`,
      );
  }
  return issues;
};

export const emailNotification: ReleaseNotificationDefinition = {
  id: EMAIL_NOTIFICATION_ID,
  label: "Email",
  description: "Email the result of a run through Resend, to one or several addresses.",
  icon: { type: "icon", icon: "mdi-email-outline" },
  fields: [
    emailConnectionField,
    {
      key: "to",
      type: "text",
      label: "To",
      description: "One or more addresses, separated by commas (at most 50).",
      placeholder: "producer@studio.com, qa@studio.com",
      required: true,
    },
    {
      key: "subject",
      type: "text",
      label: "Subject",
      description: "The same variables work here.",
      placeholder: "{{workflow}} {{version}}: {{status}}",
      required: true,
    },
    {
      key: "template",
      type: "text",
      label: "Message",
      description: TEMPLATE_HELP,
      required: true,
    },
  ],
  createDefaultConfig: () => ({
    account: "",
    to: "",
    subject: "{{workflow}} {{version}}: {{status}}",
    template: DEFAULT_TEMPLATE,
  }),
  validate: validateEmail,
};

export const emailSender: NotificationSender = ({ values, render, renderTemplate, signal }) =>
  sendEmail(
    {
      apiKey: values.apiKey ?? "",
      from: values.from ?? "",
      to: values.to ?? "",
      subject: renderTemplate(values.subject ?? ""),
      text: render(),
    },
    signal,
  );

/** An email account is checked by shape only: Resend cannot confirm a key without sending. */
export const testEmailConnection = async ({
  values,
}: ConnectionTestContext<unknown>): Promise<PreflightResult> => {
  const key = String(values.apiKey ?? "").trim();
  if (!key.startsWith("re_"))
    return { status: "failed", message: "A Resend API key starts with 're_'." };
  if (!isValidSender(String(values.from ?? "")))
    return { status: "failed", message: "The From address is not valid." };
  return {
    status: "unverifiable",
    reason:
      "Resend cannot check a sending-only key without sending an email, so only its shape was checked.",
  };
};

/** A saved webhook URL is checked without telling the channel anything it should not see. */
export const testWebhookConnection = async (
  context: ConnectionTestContext<unknown>,
): Promise<PreflightResult> => {
  if ("apiKey" in context.values) return testEmailConnection(context);
  const { values, signal } = context;
  try {
    const url = parseWebhookUrl(String(values.url ?? ""));
    if (isDiscordWebhook(url)) await sendDiscord(url.href, "Pipelab connection test", signal);
    else
      await sendGeneric(
        url.href,
        "application/json",
        (escape = (value) => value) => `{"text":"${escape("Pipelab connection test")}"}`,
        signal,
      );
    return { status: "verified" };
  } catch (error) {
    return { status: "failed", message: error instanceof Error ? error.message : String(error) };
  }
};

const emailIntegration: IntegrationDefinition = {
  name: EMAIL_INTEGRATION,
  testable: true,
  fields: [
    {
      key: "apiKey",
      label: "Resend API key",
      type: "password",
      placeholder: "re_…",
    },
    {
      key: "from",
      label: "From",
      type: "text",
      placeholder: "Pipelab <builds@yourdomain.com>",
    },
  ],
};

export const provider = createProviderDefinition({
  id: PROVIDER_ID,
  packageName: PROVIDER_ID,
  name: "Notifications",
  description: "Announce finished runs to Discord, Slack, email or any webhook.",
  icon: { type: "icon", icon: "mdi-bell-outline" },
  isOfficial: true,
  integrations: [
    {
      name: WEBHOOK_INTEGRATION,
      testable: true,
      fields: [
        {
          key: "url",
          label: "Webhook URL",
          type: "password",
          placeholder: "https://discord.com/api/webhooks/…",
        },
      ],
    },
    ...(EMAIL_ENABLED ? [emailIntegration] : []),
  ],
  release: {
    notifications: [
      discordNotification,
      slackNotification,
      ...(EMAIL_ENABLED ? [emailNotification] : []),
      webhookNotification,
    ],
  },
  connectionTests: { [PROVIDER_ID]: testWebhookConnection },
  notificationSenders: {
    [DISCORD_NOTIFICATION_ID]: ({ values, message, signal }) =>
      sendDiscord(values.url ?? "", message, signal),
    [SLACK_NOTIFICATION_ID]: ({ values, render, signal }) =>
      sendSlack(values.url ?? "", render, signal),
    ...(EMAIL_ENABLED ? { [EMAIL_NOTIFICATION_ID]: emailSender } : {}),
    [WEBHOOK_NOTIFICATION_ID]: ({ values, render, signal }) =>
      sendGeneric(values.url ?? "", values.contentType ?? "", render, signal),
  },
});

export default provider;
