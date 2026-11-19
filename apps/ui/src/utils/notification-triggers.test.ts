import { describe, expect, it } from "vitest";
import { hasTrigger, summarizeTriggers, toggleTrigger } from "./notification-triggers";

const name = (id: string) => (id === "steam" ? "Steam" : id);

describe("notification triggers", () => {
  it("treats a target without triggers as run success and failure", () => {
    expect(hasTrigger({}, { on: "success" })).toBe(true);
    expect(hasTrigger({}, { on: "destination-failed", destinationId: "steam" })).toBe(false);
    expect(summarizeTriggers({}, name)).toBe("Run finished");
  });

  it("writes the defaults out on the first change, then toggles one trigger", () => {
    const withoutSuccess = toggleTrigger({}, { on: "success" }, false);
    expect(withoutSuccess).toEqual([{ on: "failure" }]);
    const deployed = { on: "destination-completed", destinationId: "steam" } as const;
    const next = toggleTrigger({ triggers: withoutSuccess }, deployed, true);
    expect(next).toEqual([{ on: "failure" }, deployed]);
    expect(toggleTrigger({ triggers: next }, deployed, true)).toHaveLength(2);
    expect(summarizeTriggers({ triggers: next }, name)).toBe("Run fails · Deployed to Steam");
    expect(summarizeTriggers({ triggers: [] }, name)).toBe("No event selected");
  });
});

describe("trigger rows", () => {
  it("builds a trigger from an event kind and replaces one row without duplicating another", async () => {
    const { nextTrigger, removeTriggerAt, replaceTrigger, triggerOfKind } =
      await import("./notification-triggers");
    expect(triggerOfKind("failure", "steam")).toEqual({ on: "failure" });
    expect(triggerOfKind("destination-failed", "steam")).toEqual({
      on: "destination-failed",
      destinationId: "steam",
    });
    // Defaults are [success, failure]; turning the first row into "failure" merges the two.
    expect(replaceTrigger({}, 0, { on: "failure" })).toEqual([{ on: "failure" }]);
    expect(removeTriggerAt({}, 0)).toEqual([{ on: "failure" }]);
    expect(nextTrigger({}, ["steam"])).toEqual({
      on: "destination-completed",
      destinationId: "steam",
    });
    expect(nextTrigger({ triggers: [{ on: "success" }, { on: "failure" }] }, [])).toBeUndefined();
  });
});
