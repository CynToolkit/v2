import {
  formatNotificationDuration,
  NOTIFICATION_TEMPLATE_VARIABLES,
  type BuildHistoryEntry,
} from "@pipelab/shared";
import type {
  TemplatePartText,
  TemplatePartVariable,
  InsertVariableResult,
} from "./notification-template.types";

type NotificationVariableName = (typeof NOTIFICATION_TEMPLATE_VARIABLES)[number];

export interface NotificationVariableInfo {
  name: NotificationVariableName;
  description: string;
  /** The value from the workflow's latest finished run; absent when there is none to show. */
  value?: string;
  /** What the preview shows when there is no real value, so a message always reads naturally. */
  sample: string;
}

/** What the workflow itself already knows, used for the preview when no run has finished yet. */
export interface NotificationSampleContext {
  workflow: string;
  version: string;
  /** Display names of the destinations that would be delivered to. */
  destinations: string[];
}

const descriptions: Record<NotificationVariableName, string> = {
  workflow: "Workflow name",
  status: "success or failure",
  duration: "How long the run took",
  version: "Version that was released",
  destinations: "One line per destination with its result and URL",
  error: "Error message of a failed run; empty on success",
};

/** Real values from the latest finished run, so a hover shows what the message would say. */
export const notificationVariableInfos = (
  latestRun: BuildHistoryEntry | undefined,
  context: NotificationSampleContext = { workflow: "My game", version: "1.0.0", destinations: [] },
): NotificationVariableInfo[] => {
  const samples: Record<NotificationVariableName, string> = {
    workflow: context.workflow,
    status: "success",
    duration: "2m 5s",
    version: context.version,
    destinations: context.destinations.map((name) => `${name}: completed`).join("\n"),
    error: "",
  };
  const finished = latestRun && latestRun.status !== "running" && latestRun.status !== "cancelled";
  const values: Partial<Record<NotificationVariableName, string>> = finished
    ? {
        workflow: latestRun.workflowName,
        status: latestRun.status === "completed" ? "success" : "failure",
        duration:
          latestRun.duration === undefined
            ? undefined
            : formatNotificationDuration(latestRun.duration),
        version: latestRun.version,
        error: latestRun.error?.message ?? "",
      }
    : {};
  return NOTIFICATION_TEMPLATE_VARIABLES.map((name) => ({
    name,
    description: descriptions[name],
    value: values[name] || undefined,
    sample: samples[name],
  }));
};

export type TemplatePart = TemplatePartText | TemplatePartVariable;

const variablePattern = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g;

/** Splits a template so each `{{name}}` can be drawn as a token. Concatenated, the text is unchanged. */
export const splitTemplate = (template: string): TemplatePart[] => {
  const known = new Set<string>(NOTIFICATION_TEMPLATE_VARIABLES);
  const parts: TemplatePart[] = [];
  let last = 0;
  for (const match of template.matchAll(variablePattern)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ kind: "text", text: template.slice(last, start) });
    parts.push({ kind: "variable", text: match[0], name: match[1]!, known: known.has(match[1]!) });
    last = start + match[0].length;
  }
  if (last < template.length) parts.push({ kind: "text", text: template.slice(last) });
  return parts;
};

/** The template with `{{name}}` inserted over the selection. Returns the text and caret position. */
export const insertVariable = (
  template: string,
  name: string,
  selectionStart: number,
  selectionEnd: number,
): InsertVariableResult => {
  const token = `{{${name}}}`;
  return {
    value: template.slice(0, selectionStart) + token + template.slice(selectionEnd),
    caret: selectionStart + token.length,
  };
};

/** The message as a run would send it: real values where known, samples elsewhere. */
export const renderTemplatePreview = (
  template: string,
  variables: NotificationVariableInfo[],
): string =>
  splitTemplate(template)
    .map((part) => {
      if (part.kind === "text") return part.text;
      const info = variables.find((candidate) => candidate.name === part.name);
      return info ? (info.value ?? info.sample) : part.text;
    })
    .join("");
