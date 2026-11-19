import { describe, expect, it } from "vitest";
import {
  escapeJsonString,
  formatNotificationDuration,
  notificationTargetFires,
  renderNotificationTemplate,
  shouldNotifyRun,
  unknownNotificationTemplateVariables,
} from "./notification";
import type { ReleaseNotificationEvent } from "./types";

const event: ReleaseNotificationEvent = {
  workflow: "My game",
  status: "failure",
  version: "1.2.3",
  durationMs: 125_000,
  destinations: [
    {
      destinationId: "steam",
      name: "Steam",
      status: "completed",
      url: "https://store.example/app",
    },
    { destinationId: "itch", name: "Itch", status: "failed", error: "bad key" },
  ],
  error: 'upload "failed"',
};

describe("notification templates", () => {
  it("fills every variable", () => {
    expect(
      renderNotificationTemplate(
        "{{workflow}} {{version}} {{status}} {{duration}}\n{{destinations}}\n{{error}}",
        event,
      ),
    ).toBe(
      'My game 1.2.3 failure 2m 5s\nSteam: completed (https://store.example/app)\nItch: failed (bad key)\nupload "failed"',
    );
  });

  it("leaves unknown names as written and escapes only substituted values", () => {
    expect(
      renderNotificationTemplate('{"a":"{{error}}","b":"{{nope}}"}', event, escapeJsonString),
    ).toBe('{"a":"upload \\"failed\\"","b":"{{nope}}"}');
    expect(unknownNotificationTemplateVariables("{{workflow}} {{nope}} {{ other }}")).toEqual([
      "nope",
      "other",
    ]);
  });

  it("formats durations", () => {
    expect(formatNotificationDuration(400)).toBe("0s");
    expect(formatNotificationDuration(59_000)).toBe("59s");
    expect(formatNotificationDuration(3_660_000)).toBe("1h 1m");
  });
});

describe("shouldNotifyRun", () => {
  it("defaults both outcomes to on and never notifies a cancelled run", () => {
    expect(shouldNotifyRun(undefined, "success")).toBe(true);
    expect(shouldNotifyRun(undefined, "failure")).toBe(true);
    expect(shouldNotifyRun({ onSuccess: false }, "success")).toBe(false);
    expect(shouldNotifyRun({ onFailure: false }, "failure")).toBe(false);
    expect(shouldNotifyRun({}, "cancelled")).toBe(false);
  });
});

describe("notificationTargetFires", () => {
  it("fires on any finished run when no triggers are set", () => {
    expect(notificationTargetFires({}, event, undefined, "success")).toBe(true);
    expect(notificationTargetFires({}, event, undefined, "failure")).toBe(true);
    expect(notificationTargetFires({}, event, undefined, "cancelled")).toBe(false);
  });

  it("fires only on the chosen run outcome, still gated by the workflow switches", () => {
    const failureOnly = { triggers: [{ on: "failure" as const }] };
    expect(notificationTargetFires(failureOnly, event, undefined, "success")).toBe(false);
    expect(notificationTargetFires(failureOnly, event, undefined, "failure")).toBe(true);
    expect(notificationTargetFires(failureOnly, event, { onFailure: false }, "failure")).toBe(
      false,
    );
  });

  it("fires on a named destination's outcome, whatever the run's overall status", () => {
    const deployed = {
      triggers: [{ on: "destination-completed" as const, destinationId: "steam" }],
    };
    const itchFailed = { triggers: [{ on: "destination-failed" as const, destinationId: "itch" }] };
    const itchDeployed = {
      triggers: [{ on: "destination-completed" as const, destinationId: "itch" }],
    };
    expect(notificationTargetFires(deployed, event, undefined, "failure")).toBe(true);
    expect(notificationTargetFires(itchFailed, event, { onFailure: false }, "failure")).toBe(true);
    expect(notificationTargetFires(itchDeployed, event, undefined, "failure")).toBe(false);
    expect(notificationTargetFires(deployed, event, undefined, "cancelled")).toBe(false);
  });
});
