import type { WorkflowTask } from "@pipelab/workflow-runtime";
import * as v from "valibot";
import { tauri, type TauriExecutionContext } from "./tauri";
import { defaultTauriConfig } from "./utils";
import type { ProviderExecutables } from "@pipelab/plugin-core";

const d = defaultTauriConfig;
// Each input keeps its default when it is unset or has an unexpected type.
const withDefault = <const S extends v.GenericSchema>(schema: S, fallback: v.InferOutput<S>) =>
  v.fallback(schema, fallback);

const tauriInputsSchema = v.object({
  alwaysOnTop: withDefault(v.boolean(), d.alwaysOnTop),
  appBundleId: withDefault(v.string(), d.appBundleId),
  appCategoryType: withDefault(v.string(), d.appCategoryType),
  appCopyright: withDefault(v.string(), d.appCopyright),
  appVersion: withDefault(v.string(), d.appVersion),
  author: withDefault(v.string(), d.author),
  description: withDefault(v.string(), d.description),
  tauriVersion: withDefault(v.string(), d.tauriVersion),
  enableExtraLogging: withDefault(v.boolean(), d.enableExtraLogging),
  clearServiceWorkerOnBoot: withDefault(v.boolean(), d.clearServiceWorkerOnBoot),
  frame: withDefault(v.boolean(), d.frame),
  fullscreen: withDefault(v.boolean(), d.fullscreen),
  icon: withDefault(v.string(), d.icon),
  height: withDefault(v.number(), d.height),
  name: withDefault(v.string(), d.name),
  toolbar: withDefault(v.boolean(), d.toolbar),
  transparent: withDefault(v.boolean(), d.transparent),
  width: withDefault(v.number(), d.width),
  enableSteamSupport: withDefault(v.boolean(), d.enableSteamSupport),
  steamGameId: withDefault(v.number(), d.steamGameId),
  ignore: withDefault(v.array(v.string()), d.ignore),
  openDevtoolsOnStart: withDefault(v.boolean(), d.openDevtoolsOnStart),
  enableDiscordSupport: withDefault(v.boolean(), d.enableDiscordSupport),
  discordAppId: withDefault(v.string(), d.discordAppId),
  customPackages: v.fallback(v.optional(v.array(v.string())), undefined),
  backgroundColor: withDefault(v.string(), d.backgroundColor),
});

export interface TauriWorkflowTaskServices {
  context: TauriExecutionContext["context"];
  executables: ProviderExecutables;
  workflowCachePath: string;
}

export const tauriPackageWorkflowTaskFactory =
  (services: TauriWorkflowTaskServices): WorkflowTask<TauriWorkflowTaskServices> =>
  async (task) => {
    const appFolder = task.inputs["input-folder"];
    const completeConfiguration: DesktopApp.Tauri = {
      ...defaultTauriConfig,
      ...v.parse(tauriInputsSchema, task.inputs),
    };

    const execution: TauriExecutionContext = {
      cwd: task.workspace.root,
      log: task.log,
      inputs: task.inputs,
      paths: {
        node: services.executables.node,
        cache: services.workflowCachePath,
      },
      abortSignal: task.signal,
      context: services.context,
    };
    const result = await tauri(
      "package",
      typeof appFolder === "string" ? appFolder : undefined,
      execution,
      completeConfiguration,
    );
    if (!result) return {};

    task.setArtifact("output", result.folder);
    return { output: result.folder, binary: result.binary };
  };

export const tauriWorkflowTaskFactories = {
  "@pipelab/plugin-tauri/tauri:package:v2": tauriPackageWorkflowTaskFactory,
};
