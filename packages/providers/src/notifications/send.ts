import { escapeJsonString } from "@pipelab/shared";
import type { SendEmailInput } from "./send.types";

import { DISCORD_MESSAGE_LIMIT } from "./metadata";

export { DISCORD_MESSAGE_LIMIT };
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/** Webhook URLs are secrets: they must be HTTPS, except to this machine, which is for local testing. */
export const parseWebhookUrl = (value: string): URL => {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("The webhook URL is not a valid URL.");
  }
  const loopbackHttp = url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname);
  if (url.protocol !== "https:" && !loopbackHttp)
    throw new Error("The webhook URL must use https (http is only accepted for localhost).");
  return url;
};

export const isDiscordWebhook = (url: URL): boolean =>
  /(^|\.)discord(app)?\.com$/.test(url.hostname) && url.pathname.startsWith("/api/webhooks/");

const truncate = (message: string, limit: number): string =>
  message.length <= limit ? message : `${message.slice(0, limit - 1)}…`;

const REQUEST_TIMEOUT_MS = 8000;

/** Never includes the URL or response body in the error: both can carry the secret. */
const postWebhook = async (
  url: URL,
  body: string,
  contentType: string,
  signal?: AbortSignal,
): Promise<void> => {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
      redirect: "error",
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (error) {
    const reason = timeout.aborted
      ? "timed out"
      : error instanceof Error && error.name === "AbortError"
        ? "was cancelled"
        : "could not be reached";
    throw new Error(`The webhook ${reason}.`, { cause: error });
  }
  if (!response.ok) throw new Error(`The webhook answered HTTP ${response.status}.`);
};

export const sendDiscord = async (
  rawUrl: string,
  message: string,
  signal?: AbortSignal,
): Promise<void> => {
  const url = parseWebhookUrl(rawUrl);
  await postWebhook(
    url,
    JSON.stringify({ content: truncate(message, DISCORD_MESSAGE_LIMIT) }),
    "application/json",
    signal,
  );
};

/** The body is the template, rendered. A JSON body gets JSON-escaped values so it stays valid. */
export const sendGeneric = async (
  rawUrl: string,
  contentType: string,
  render: (escape?: (value: string) => string) => string,
  signal?: AbortSignal,
): Promise<void> => {
  const url = parseWebhookUrl(rawUrl);
  const type = contentType.trim() || "application/json";
  await postWebhook(url, /json/i.test(type) ? render(escapeJsonString) : render(), type, signal);
};

const SLACK_MESSAGE_LIMIT = 40000;

const isSlackWebhook = (url: URL): boolean =>
  /(^|\.)slack(-gov)?\.com$/.test(url.hostname) && url.pathname.startsWith("/");

/** Slack reads `&`, `<` and `>` in text as markup, so a substituted value must not carry them. */
const escapeSlack = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const sendSlack = async (
  rawUrl: string,
  render: (escape?: (value: string) => string) => string,
  signal?: AbortSignal,
): Promise<void> => {
  const url = parseWebhookUrl(rawUrl);
  if (!isSlackWebhook(url) && !LOOPBACK_HOSTS.has(url.hostname))
    throw new Error("That is not a Slack webhook URL (expected hooks.slack.com).");
  await postWebhook(
    url,
    JSON.stringify({ text: truncate(render(escapeSlack), SLACK_MESSAGE_LIMIT) }),
    "application/json",
    signal,
  );
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const MAX_EMAIL_RECIPIENTS = 50;
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/** Accepts `a@x.com, b@y.com` and returns the addresses, or throws naming the bad one. */
export const parseRecipients = (value: string): string[] => {
  const recipients = value
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (!recipients.length) throw new Error("At least one recipient is required.");
  if (recipients.length > MAX_EMAIL_RECIPIENTS)
    throw new Error(`At most ${MAX_EMAIL_RECIPIENTS} recipients are allowed.`);
  const bad = recipients.find((address) => !emailPattern.test(address));
  if (bad) throw new Error(`'${bad}' is not a valid email address.`);
  return recipients;
};

/** The sender may be `name@x.com` or `Name <name@x.com>`. */
export const isValidSender = (value: string): boolean => {
  const trimmed = value.trim();
  const named = /^[^<>]+<([^<>\s]+)>$/.exec(trimmed);
  return emailPattern.test(named ? named[1]! : trimmed);
};

/** Never includes the key or the response body: only what to fix. */
export const sendEmail = async (input: SendEmailInput, signal?: AbortSignal): Promise<void> => {
  if (!input.apiKey.trim()) throw new Error("The Resend API key is missing.");
  if (!isValidSender(input.from)) throw new Error("The From address is not valid.");
  const to = parseRecipients(input.to);
  if (!input.subject.trim()) throw new Error("The subject is empty.");
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: input.from.trim(),
        to,
        subject: input.subject.replace(/[\r\n]+/g, " ").trim(),
        text: input.text,
      }),
      redirect: "error",
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (error) {
    throw new Error(
      timeout.aborted
        ? "Resend timed out."
        : error instanceof Error && error.name === "AbortError"
          ? "The email was cancelled."
          : "Resend could not be reached.",
      { cause: error },
    );
  }
  if (response.ok) return;
  if (response.status === 401 || response.status === 403)
    throw new Error(`Resend rejected the API key (HTTP ${response.status}).`);
  if (response.status === 422)
    throw new Error(
      "Resend rejected the message (HTTP 422): check the From domain and recipients.",
    );
  throw new Error(`Resend answered HTTP ${response.status}.`);
};
