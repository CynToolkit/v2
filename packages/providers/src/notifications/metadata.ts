import type {
  IntegrationDefinition,
  ReleaseNotificationDescriptor,
  RendererProviderMetadata,
} from "@pipelab/shared";
import { discordLogo } from "./icons";

export const DISCORD_MESSAGE_LIMIT = 2000;

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
export const WEBHOOK_INTEGRATION = "Notification webhook";
export const EMAIL_INTEGRATION = "Email (Resend)";

export const DEFAULT_TEMPLATE =
  "{{workflow}} {{version}}: {{status}} in {{duration}}\n{{destinations}}\n{{error}}";
export const DEFAULT_JSON_TEMPLATE =
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

const emailConnectionField = {
  key: "account",
  type: "connection" as const,
  integration: EMAIL_INTEGRATION,
  label: "Email account",
  description: "The saved Resend API key and sender. The key is never stored in the workflow file.",
  required: true,
};

export const discordNotificationDescriptor: ReleaseNotificationDescriptor = {
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
};

export const webhookNotificationDescriptor: ReleaseNotificationDescriptor = {
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
};

export const slackNotificationDescriptor: ReleaseNotificationDescriptor = {
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
};

export const emailNotificationDescriptor: ReleaseNotificationDescriptor = {
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
};

export const emailIntegration: IntegrationDefinition = {
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

export const notificationsMetadata = {
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
      discordNotificationDescriptor,
      slackNotificationDescriptor,
      ...(EMAIL_ENABLED ? [emailNotificationDescriptor] : []),
      webhookNotificationDescriptor,
    ],
  },
} satisfies RendererProviderMetadata;
