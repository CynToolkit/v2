import * as v from "valibot";
import { stringInput, parseOrUndefined } from "@pipelab/shared";
import { dirname, delimiter } from "node:path";
import { ensureButler } from "./ensure.js";
import { runWithLiveLogs } from "@pipelab/plugin-core";
import type { PipelabContext } from "@pipelab/plugin-core";
import type { WorkflowTask, WorkflowTaskContext } from "@pipelab/workflow-runtime";
import type { ConnectionTestContext, PreflightContext, PreflightResult } from "@pipelab/shared";
import { failed, preflightSignal, unverifiable, verified } from "../preflight";

export const WORKFLOW_TASK_ID = "@pipelab/plugin-itch/itch-upload";

const butlerOutputSchema = v.variant("type", [
  v.looseObject({ type: v.literal("log"), message: v.string() }),
  v.looseObject({ type: v.literal("progress"), progress: v.number(), eta: v.number() }),
]);

const itchUserSchema = v.looseObject({
  user: v.optional(v.looseObject({ username: v.optional(v.string()) })),
  errors: v.optional(v.unknown()),
});
const itchGamesSchema = v.looseObject({
  games: v.optional(v.array(v.looseObject({ url: v.optional(v.string()) }))),
});

export const resolveItchUsername = async (apiKey: string): Promise<string> => {
  const response = await fetch(`https://itch.io/api/1/${encodeURIComponent(apiKey)}/me`);
  if (!response.ok)
    throw new Error(`Unable to resolve the Itch profile (HTTP ${response.status}).`);
  const data = parseOrUndefined(itchUserSchema, await response.json());
  const username = data?.user?.username;
  if (!username) throw new Error("The Itch account does not contain a username.");
  return username;
};

const redactApiKey = (value: string, apiKey: string): string =>
  apiKey ? value.split(apiKey).join("[REDACTED]") : value;

const sanitizeApiKeyError = (error: unknown, apiKey: string): Error => {
  const message = error instanceof Error ? error.message : String(error);
  const sanitizedMessage = redactApiKey(message, apiKey);
  if (error instanceof Error && sanitizedMessage === message) return error;

  const sanitizedError = new Error(sanitizedMessage);
  if (error instanceof Error) sanitizedError.name = error.name;
  return sanitizedError;
};

export interface ItchTaskServices {
  context: PipelabContext;
}

export const createItchUploadTask =
  <TServices extends ItchTaskServices>(services: TServices): WorkflowTask<TServices> =>
  async (taskContext: WorkflowTaskContext<TServices>) => {
    const { context } = services;
    const { inputs, signal, log } = taskContext;
    const runtimeInputs = { ...inputs };
    const accountConnectionId = String(runtimeInputs.accountConnectionId || "").trim();
    if (!accountConnectionId)
      throw new Error("An Itch account Connection is required for this workflow task.");
    const connectionValues = taskContext.connectionValues[accountConnectionId];
    if (!connectionValues)
      throw new Error(
        `Itch account Connection '${accountConnectionId}' was not resolved for this run.`,
      );
    runtimeInputs.user =
      connectionValues.username || connectionValues.user || runtimeInputs.user || "";
    runtimeInputs["api-key"] = connectionValues.apiKey ?? "";
    const apiKey = typeof runtimeInputs["api-key"] === "string" ? runtimeInputs["api-key"] : "";
    if (!apiKey) throw new Error("Itch account connection has no API key");
    const safeLog = (...args: unknown[]) =>
      log(
        ...args.map((value) => (typeof value === "string" ? redactApiKey(value, apiKey) : value)),
      );
    if (!runtimeInputs.user && apiKey) {
      try {
        runtimeInputs.user = await resolveItchUsername(apiKey);
      } catch (error) {
        throw sanitizeApiKeyError(error, apiKey);
      }
    }
    const node = context.getNodePath();
    const butlerPath = await ensureButler(context, "LATEST", safeLog);

    safeLog("Uploading to itch");

    await runWithLiveLogs(
      butlerPath,
      [
        "push",
        stringInput(runtimeInputs, "input-folder"),
        `${stringInput(runtimeInputs, "user")}/${stringInput(runtimeInputs, "project")}:${stringInput(runtimeInputs, "channel")}`,
        "--json",
        ...(String(runtimeInputs.version || "").trim()
          ? ["--userversion", String(runtimeInputs.version).trim()]
          : []),
      ],
      {
        env: {
          ...process.env,
          // DEBUG: '*',
          PATH: `${dirname(node)}${delimiter}${process.env.PATH}`,
          BUTLER_API_KEY: apiKey,
        },
        cancelSignal: signal,
      },
      safeLog,
      {
        onStdout(data) {
          const jsons = data.trim().split("\n");
          for (const jsonData of jsons) {
            const json = parseOrUndefined(butlerOutputSchema, JSON.parse(jsonData));
            switch (json?.type) {
              case "log":
                safeLog(json.message);
                break;
              case "progress":
                safeLog(`${json.progress}% - ETA: ${json.eta}s`);
                break;
            }
          }
        },
      },
    ).catch((error: unknown) => {
      throw sanitizeApiKeyError(error, apiKey);
    });

    safeLog("Uploaded to itch");
  };

/** Only a rejected key fails; network trouble or a server error stays unverifiable. */
const verifyItchApiKey = async (apiKey: string, signal?: AbortSignal): Promise<PreflightResult> => {
  if (!apiKey) return failed("The Itch account connection has no API key.");
  let response: Response;
  try {
    response = await fetch(`https://itch.io/api/1/${encodeURIComponent(apiKey)}/me`, {
      signal: preflightSignal(signal),
    });
  } catch {
    return unverifiable("itch.io could not be reached.");
  }
  if (response.status >= 500) return unverifiable(`itch.io answered HTTP ${response.status}.`);
  if (response.status === 401 || response.status === 403)
    return failed("The Itch API key was rejected.");
  try {
    const data = parseOrUndefined(itchUserSchema, await response.json());
    if (data?.user?.username) return verified();
    if (Array.isArray(data?.errors) && data.errors.length)
      return failed("The Itch API key was rejected.");
  } catch {
    // Fall through: an unreadable body is not a definitive answer.
  }
  return unverifiable("itch.io gave no definitive answer.");
};

/** The account's own games are the ones butler may push to; a missing one is definitive. */
const verifyItchGame = async (
  apiKey: string,
  project: string,
  signal?: AbortSignal,
): Promise<PreflightResult> => {
  const slug = project.includes("/") ? project.split("/").pop()! : project;
  if (!slug) return failed("The Itch project is empty.");
  try {
    const response = await fetch(`https://itch.io/api/1/${encodeURIComponent(apiKey)}/my-games`, {
      signal: preflightSignal(signal),
    });
    if (!response.ok) return unverifiable(`itch.io answered HTTP ${response.status}.`);
    const data = parseOrUndefined(itchGamesSchema, await response.json());
    if (!Array.isArray(data?.games)) return unverifiable("itch.io gave no list of games.");
    const known = data.games.some((game) => {
      try {
        return new URL(game.url ?? "").pathname.split("/").filter(Boolean).pop() === slug;
      } catch {
        return false;
      }
    });
    return known
      ? verified()
      : failed(
          `No itch.io game '${slug}' on this account. Create it on itch.io or fix the project name.`,
        );
  } catch {
    return unverifiable("itch.io could not be reached.");
  }
};

export const checkItchPreflight = async ({
  inputs,
  connectionValues,
  signal,
}: PreflightContext<unknown>): Promise<PreflightResult> => {
  const alias = String(inputs.accountConnectionId || "").trim();
  const apiKey = String(connectionValues[alias]?.apiKey ?? "").trim();
  const account = await verifyItchApiKey(apiKey, signal);
  if (account.status !== "verified") return account;
  return verifyItchGame(apiKey, String(inputs.project ?? "").trim(), signal);
};

export const testItchConnection = async ({
  values,
  signal,
}: ConnectionTestContext<unknown>): Promise<PreflightResult> =>
  verifyItchApiKey(String(values.apiKey ?? "").trim(), signal);
