import type { InferOutput } from "valibot";
import {
  union,
  literal,
  string,
  boolean,
  object,
  number,
  array,
  optional,
  looseObject,
} from "valibot";

export const AppSettingsValidator = object({
  theme: union([literal("light"), literal("dark")]),
  version: literal("1.0.0"),
  locale: union([
    literal("en-US"),
    literal("fr-FR"),
    literal("pt-BR"),
    literal("zh-CN"),
    literal("es-ES"),
    literal("de-DE"),
  ]),
  tours: object({
    dashboard: object({
      step: number(),
      completed: boolean(),
    }),
    editor: object({
      step: number(),
      completed: boolean(),
    }),
  }),
  autosave: boolean(),
  agents: array(
    object({
      id: string(),
      name: string(),
      url: string(),
    }),
  ),
  cacheFolder: optional(string()),
  tempFolder: optional(string()),
});

export const ConnectionValidator = looseObject({
  id: string(),
  // Persisted provider identity; retain this key for existing connection files.
  pluginName: string(),
  integrationName: optional(string()),
  name: string(),
  createdAt: string(),
  isDefault: boolean(),
});

export const WorkflowConnectionBindingValidator = object({
  workflowId: string(),
  alias: string(),
  connectionId: string(),
});

export const ConnectionsValidator = object({
  version: literal("1.0.0"),
  connections: array(ConnectionValidator),
  workflowBindings: optional(array(WorkflowConnectionBindingValidator)),
});

export type Connection = InferOutput<typeof ConnectionValidator>;
export type WorkflowConnectionBinding = InferOutput<typeof WorkflowConnectionBindingValidator>;
export type ConnectionsConfig = InferOutput<typeof ConnectionsValidator>;

export type AppConfig = InferOutput<typeof AppSettingsValidator>;
