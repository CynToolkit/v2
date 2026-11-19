import {
  DEFAULT_NOTIFICATION_TRIGGERS,
  type ReleaseNotificationConfig,
  type ReleaseNotificationTrigger,
} from "@pipelab/shared";

export const effectiveTriggers = (target: Pick<ReleaseNotificationConfig, "triggers">) =>
  target.triggers ?? DEFAULT_NOTIFICATION_TRIGGERS;

const sameTrigger = (a: ReleaseNotificationTrigger, b: ReleaseNotificationTrigger) =>
  a.on === b.on &&
  ("destinationId" in a ? a.destinationId : undefined) ===
    ("destinationId" in b ? b.destinationId : undefined);

export const hasTrigger = (
  target: Pick<ReleaseNotificationConfig, "triggers">,
  trigger: ReleaseNotificationTrigger,
) => effectiveTriggers(target).some((candidate) => sameTrigger(candidate, trigger));

/** The triggers after switching one on or off. The first change writes the defaults out explicitly. */
export const toggleTrigger = (
  target: Pick<ReleaseNotificationConfig, "triggers">,
  trigger: ReleaseNotificationTrigger,
  enabled: boolean,
): ReleaseNotificationTrigger[] => {
  const rest = effectiveTriggers(target).filter((candidate) => !sameTrigger(candidate, trigger));
  return enabled ? [...rest, trigger] : rest;
};

/** One line for the card, such as `On failure · Deployed to Steam`. */
export const summarizeTriggers = (
  target: Pick<ReleaseNotificationConfig, "triggers">,
  destinationName: (id: string) => string,
) => {
  const triggers = effectiveTriggers(target);
  if (!triggers.length) return "No event selected";
  const has = (on: "success" | "failure") => triggers.some((trigger) => trigger.on === on);
  const parts: string[] = [];
  if (has("success") && has("failure")) parts.push("Run finished");
  else if (has("success")) parts.push("Run succeeds");
  else if (has("failure")) parts.push("Run fails");
  for (const trigger of triggers)
    if ("destinationId" in trigger)
      parts.push(
        trigger.on === "destination-completed"
          ? `Deployed to ${destinationName(trigger.destinationId)}`
          : `${destinationName(trigger.destinationId)} fails`,
      );
  return parts.join(" · ");
};

/** What a trigger row's event dropdown offers. The two destination events also pick a destination. */
export const TRIGGER_EVENTS = [
  { on: "success", label: "A run succeeds", icon: "pi pi-check-circle", needsDestination: false },
  {
    on: "failure",
    label: "A run fails",
    icon: "pi pi-exclamation-circle",
    needsDestination: false,
  },
  {
    on: "destination-completed",
    label: "A destination is deployed",
    icon: "pi pi-cloud-upload",
    needsDestination: true,
  },
  {
    on: "destination-failed",
    label: "A deployment fails",
    icon: "pi pi-times-circle",
    needsDestination: true,
  },
] as const;

export type TriggerEventKind = (typeof TRIGGER_EVENTS)[number]["on"];

/** A trigger of the given kind; destination events start on `destinationId`. */
export const triggerOfKind = (
  on: TriggerEventKind,
  destinationId: string | undefined,
): ReleaseNotificationTrigger =>
  on === "success" || on === "failure" ? { on } : { on, destinationId: destinationId ?? "" };

/** Replaces one row, dropping any other row that became identical to it. */
export const replaceTrigger = (
  target: Pick<ReleaseNotificationConfig, "triggers">,
  index: number,
  trigger: ReleaseNotificationTrigger,
): ReleaseNotificationTrigger[] =>
  effectiveTriggers(target)
    .map((candidate, position) => (position === index ? trigger : candidate))
    .filter(
      (candidate, position, all) =>
        position === index || !sameTrigger(candidate, all[index] ?? trigger),
    );

export const removeTriggerAt = (
  target: Pick<ReleaseNotificationConfig, "triggers">,
  index: number,
): ReleaseNotificationTrigger[] =>
  effectiveTriggers(target).filter((_, position) => position !== index);

/** The next row to offer: the first event the target does not use yet, preferring run events. */
export const nextTrigger = (
  target: Pick<ReleaseNotificationConfig, "triggers">,
  destinationIds: string[],
): ReleaseNotificationTrigger | undefined => {
  const candidates: ReleaseNotificationTrigger[] = [
    { on: "success" },
    { on: "failure" },
    ...destinationIds.flatMap((destinationId) => [
      { on: "destination-completed" as const, destinationId },
      { on: "destination-failed" as const, destinationId },
    ]),
  ];
  return candidates.find((candidate) => !hasTrigger(target, candidate));
};
