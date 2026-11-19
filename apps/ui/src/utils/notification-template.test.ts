import { describe, expect, it } from "vitest";
import type { BuildHistoryEntry } from "@pipelab/shared";
import {
  insertVariable,
  notificationVariableInfos,
  renderTemplatePreview,
  splitTemplate,
} from "./notification-template";

const run = (patch: Partial<BuildHistoryEntry>) => ({ ...patch }) as BuildHistoryEntry;

describe("notification template editor helpers", () => {
  it("inserts a variable over the selection and moves the caret after it", () => {
    expect(insertVariable("Hello !", "workflow", 6, 6)).toEqual({
      value: "Hello {{workflow}}!",
      caret: 18,
    });
    expect(insertVariable("a XX b", "status", 2, 4).value).toBe("a {{status}} b");
  });

  it("splits a template into text and known or unknown variable tokens", () => {
    const parts = splitTemplate("{{ workflow }} is {{nope}}");
    expect(parts.map((part) => part.text).join("")).toBe("{{ workflow }} is {{nope}}");
    expect(parts.filter((part) => part.kind === "variable")).toMatchObject([
      { name: "workflow", known: true },
      { name: "nope", known: false },
    ]);
  });

  it("shows values from the latest finished run and none without one", () => {
    expect(notificationVariableInfos(undefined).every((info) => info.value === undefined)).toBe(
      true,
    );
    const infos = notificationVariableInfos(
      run({ status: "failed", workflowName: "Demo", duration: 65_000, version: "1.2.0" }),
    );
    const valueOf = (name: string) => infos.find((info) => info.name === name)?.value;
    expect(valueOf("workflow")).toBe("Demo");
    expect(valueOf("status")).toBe("failure");
    expect(valueOf("duration")).toBe("1m 5s");
    expect(valueOf("version")).toBe("1.2.0");
    expect(
      notificationVariableInfos(run({ status: "running", workflowName: "Demo" })).every(
        (info) => info.value === undefined,
      ),
    ).toBe(true);
  });

  it("previews with real values first, samples next, and unknown names untouched", () => {
    const infos = notificationVariableInfos(
      run({ status: "completed", workflowName: "Demo", duration: 5_000 }),
      { workflow: "Context", version: "9.9.9", destinations: ["Steam", "Itch.io"] },
    );
    expect(renderTemplatePreview("{{workflow}} {{version}} {{status}} {{nope}}", infos)).toBe(
      "Demo 9.9.9 success {{nope}}",
    );
    expect(renderTemplatePreview("{{destinations}}", infos)).toBe(
      "Steam: completed\nItch.io: completed",
    );
  });
});
