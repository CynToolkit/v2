import { createProviderDefinition } from "@pipelab/shared";
import type {
  ConnectionTestContext,
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
  parseRecipients,
  parseWebhookUrl,
  sendDiscord,
  sendEmail,
  sendGeneric,
  sendSlack,
} from "./send";
import {
  DISCORD_NOTIFICATION_ID,
  EMAIL_NOTIFICATION_ID,
  EMAIL_ENABLED,
  PROVIDER_ID,
  SLACK_NOTIFICATION_ID,
  WEBHOOK_NOTIFICATION_ID,
  discordNotificationDescriptor,
  emailNotificationDescriptor,
  notificationsMetadata,
  slackNotificationDescriptor,
  webhookNotificationDescriptor,
} from "./metadata";

export {
  DISCORD_NOTIFICATION_ID,
  EMAIL_ENABLED,
  EMAIL_NOTIFICATION_ID,
  SLACK_NOTIFICATION_ID,
  WEBHOOK_NOTIFICATION_ID,
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
  ...discordNotificationDescriptor,
  validate: validateTarget,
};

export const webhookNotification: ReleaseNotificationDefinition = {
  ...webhookNotificationDescriptor,
  validate: validateTarget,
};

export const slackNotification: ReleaseNotificationDefinition = {
  ...slackNotificationDescriptor,
  validate: validateTarget,
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
  ...emailNotificationDescriptor,
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

export const provider = createProviderDefinition({
  ...notificationsMetadata,
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
