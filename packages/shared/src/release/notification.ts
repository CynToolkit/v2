import type { ReleaseNotificationConfig, ReleaseNotificationEvent } from "./types";
import { NOTIFICATION_TEMPLATE_VARIABLES } from "./types";

const templateVariablePattern = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g;

/** Names used in a template that no event provides, so a typo is caught before a run. */
export const unknownNotificationTemplateVariables = (template: string): string[] => {
  const known = new Set<string>(NOTIFICATION_TEMPLATE_VARIABLES);
  const unknown = new Set<string>();
  for (const match of template.matchAll(templateVariablePattern))
    if (!known.has(match[1]!)) unknown.add(match[1]!);
  return [...unknown];
};

export const formatNotificationDuration = (durationMs: number): string => {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

/** One line per delivery: `name: completed (url)`. Empty when the run delivered nothing. */
const describeDestinations = (event: ReleaseNotificationEvent): string =>
  event.destinations
    .map((destination) => {
      const detail = destination.url ?? (destination.status === "failed" ? destination.error : "");
      return `${destination.name}: ${destination.status}${detail ? ` (${detail})` : ""}`;
    })
    .join("\n");

/** Escapes a value for the inside of a JSON string, so a JSON template stays valid. */
export const escapeJsonString = (value: string): string => JSON.stringify(value).slice(1, -1);

/**
 * Fills `{{name}}` placeholders. A name no event provides is left as written. `escape` is applied
 * to each substituted value, never to the template text around it.
 */
export const renderNotificationTemplate = (
  template: string,
  event: ReleaseNotificationEvent,
  escape: (value: string) => string = (value) => value,
): string => {
  const values: Record<(typeof NOTIFICATION_TEMPLATE_VARIABLES)[number], string> = {
    workflow: event.workflow,
    status: event.status,
    duration: formatNotificationDuration(event.durationMs),
    version: event.version,
    destinations: describeDestinations(event),
    error: event.error ?? "",
  };
  return template.replace(templateVariablePattern, (whole, name: string) =>
    Object.hasOwn(values, name) ? escape(values[name as keyof typeof values]) : whole,
  );
};

/** Whether a run's outcome is announced under the workflow's global toggles. Cancelled never is. */
export const shouldNotifyRun = (
  settings: { onSuccess?: boolean; onFailure?: boolean } | undefined,
  status: ReleaseNotificationEvent["status"] | "cancelled",
): boolean => {
  if (status === "cancelled") return false;
  return status === "success" ? settings?.onSuccess !== false : settings?.onFailure !== false;
};

/** What a target with no `triggers` has always done: announce any finished run. */
export const DEFAULT_NOTIFICATION_TRIGGERS: NonNullable<ReleaseNotificationConfig["triggers"]> = [
  { on: "success" },
  { on: "failure" },
];

/**
 * Whether a finished run fires a target. The workflow's success and failure switches only gate
 * the run-level triggers; a destination trigger is chosen on the target itself. Cancelled never fires.
 */
export const notificationTargetFires = (
  target: Pick<ReleaseNotificationConfig, "triggers">,
  event: ReleaseNotificationEvent,
  settings: { onSuccess?: boolean; onFailure?: boolean } | undefined,
  outcome: ReleaseNotificationEvent["status"] | "cancelled",
): boolean => {
  if (outcome === "cancelled") return false;
  return (target.triggers ?? DEFAULT_NOTIFICATION_TRIGGERS).some((trigger) => {
    if (!("destinationId" in trigger))
      return trigger.on === outcome && shouldNotifyRun(settings, outcome);
    const wanted = trigger.on === "destination-completed" ? "completed" : "failed";
    return event.destinations.some(
      (delivery) => delivery.destinationId === trigger.destinationId && delivery.status === wanted,
    );
  });
};
