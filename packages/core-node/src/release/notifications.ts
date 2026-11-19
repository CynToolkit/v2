import type {
  ProviderDefinition,
  ReleaseConfig,
  ReleaseNotificationEvent,
  ReleaseRegistry,
} from "@pipelab/shared";
import { notificationTargetFires, renderNotificationTemplate } from "@pipelab/shared";

/** Waits before the second and third attempts. */
export const DEFAULT_NOTIFICATION_RETRY_DELAYS_MS = [500, 2000] as const;

export interface DispatchRunNotificationsInput {
  config: ReleaseConfig;
  registry: ReleaseRegistry;
  providers: readonly Pick<ProviderDefinition, "notificationSenders">[];
  /** Connection values resolved for this run, keyed by workflow alias. */
  connectionValues: Record<string, Record<string, string>>;
  /** What the run ended as. `cancelled` never notifies. */
  outcome: ReleaseNotificationEvent["status"] | "cancelled";
  event: ReleaseNotificationEvent;
  redactString(value: string): string;
  warn(message: string): void;
  retryDelaysMs?: readonly number[];
  sleep?: (ms: number) => Promise<void>;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Announces a finished run to every enabled notification target, whichever host started it.
 * Delivery is best effort: a failing target is retried, then reported as a warning, and nothing
 * here ever throws or changes the run's own result.
 */
export const dispatchRunNotifications = async (
  input: DispatchRunNotificationsInput,
): Promise<void> => {
  const targets = (input.config.notifications ?? []).filter(
    (target) =>
      target.enabled &&
      notificationTargetFires(
        target,
        input.event,
        input.config.settings?.notifications,
        input.outcome,
      ),
  );
  if (targets.length === 0) return;

  const delays = input.retryDelaysMs ?? DEFAULT_NOTIFICATION_RETRY_DELAYS_MS;
  const sleep = input.sleep ?? wait;
  const senders = Object.assign({}, ...input.providers.map((p) => p.notificationSenders ?? {}));

  await Promise.all(
    targets.map(async (target) => {
      const label = target.name?.trim() || target.provider;
      const warn = (reason: string) =>
        input.warn(`Notification '${label}' was not delivered: ${input.redactString(reason)}`);
      try {
        const definition = input.registry.notifications?.find(
          (candidate) => candidate.id === target.provider,
        );
        const send = senders[target.provider] as
          | NonNullable<ProviderDefinition["notificationSenders"]>[string]
          | undefined;
        if (!definition || !send) return warn(`unknown notification provider ${target.provider}.`);

        const connectionField = definition.fields?.find((field) => field.type === "connection");
        const alias = connectionField ? String(target.config[connectionField.key] ?? "") : "";
        const connection = alias ? input.connectionValues[alias] : undefined;
        if (!connection) return warn(`no Connection values were provided for '${alias || "?"}'.`);

        const values: Record<string, string> = {};
        for (const [key, value] of Object.entries(target.config))
          if (typeof value === "string") values[key] = value;
        Object.assign(values, connection);

        const template = String(target.config.template ?? "");
        const render = (escape?: (value: string) => string) =>
          input.redactString(renderNotificationTemplate(template, input.event, escape));
        const renderTemplate = (text: string, escape?: (value: string) => string) =>
          input.redactString(renderNotificationTemplate(text, input.event, escape));
        const message = render();

        let lastError: unknown;
        for (let attempt = 0; attempt <= delays.length; attempt++) {
          if (attempt > 0) await sleep(delays[attempt - 1]!);
          try {
            await send({ values, message, render, renderTemplate });
            return;
          } catch (error) {
            lastError = error;
          }
        }
        warn(lastError instanceof Error ? lastError.message : String(lastError));
      } catch (error) {
        warn(error instanceof Error ? error.message : String(error));
      }
    }),
  );
};
