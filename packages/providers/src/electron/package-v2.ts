import type { WorkflowTask } from "@pipelab/workflow-runtime";
import * as v from "valibot";
import { forge, type ForgeExecutionContext } from "./forge";
import { electronPhases } from "./phases";
import { defaultElectronConfig } from "./utils";
import type { ProviderExecutables } from "@pipelab/plugin-core";

export interface ElectronWorkflowTaskServices {
  context: ForgeExecutionContext["context"];
  executables: ProviderExecutables;
  workflowCachePath: string;
}

const d = defaultElectronConfig;
// Each input keeps its default when it is unset or has an unexpected type.
const withDefault = <const S extends v.GenericSchema>(schema: S, fallback: v.InferOutput<S>) =>
  v.fallback(schema, fallback);

const electronInputsSchema = v.object({
  alwaysOnTop: withDefault(v.boolean(), d.alwaysOnTop),
  appBundleId: withDefault(v.string(), d.appBundleId),
  appCategoryType: withDefault(v.string(), d.appCategoryType),
  appCopyright: withDefault(v.string(), d.appCopyright),
  appVersion: withDefault(v.string(), d.appVersion),
  author: withDefault(v.string(), d.author),
  customMainCode: withDefault(v.string(), d.customMainCode),
  description: withDefault(v.string(), d.description),
  electronVersion: withDefault(v.string(), d.electronVersion),
  disableAsarPackaging: withDefault(v.boolean(), d.disableAsarPackaging),
  forceHighPerformanceGpu: withDefault(v.boolean(), d.forceHighPerformanceGpu),
  patchExecutable: withDefault(v.boolean(), d.patchExecutable),
  enableExtraLogging: withDefault(v.boolean(), d.enableExtraLogging),
  clearServiceWorkerOnBoot: withDefault(v.boolean(), d.clearServiceWorkerOnBoot),
  enableDisableRendererBackgrounding: withDefault(
    v.boolean(),
    d.enableDisableRendererBackgrounding,
  ),
  enableInProcessGPU: withDefault(v.boolean(), d.enableInProcessGPU),
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
  customPackages: withDefault(v.array(v.string()), d.customPackages),
  backgroundColor: withDefault(v.string(), d.backgroundColor),
  enableDoctor: withDefault(v.boolean(), d.enableDoctor),
  serverMode: withDefault(v.picklist(["default", "customProtocol"]), d.serverMode),
});

export const electronPackageWorkflowTaskFactory =
  (services: ElectronWorkflowTaskServices): WorkflowTask<ElectronWorkflowTaskServices> =>
  async (task) => {
    const { phase } = task.withPhases(electronPhases);
    const appFolder = task.inputs["input-folder"];
    const completeConfiguration: DesktopApp.Electron = {
      ...defaultElectronConfig,
      ...v.parse(electronInputsSchema, task.inputs),
    };

    const execution: ForgeExecutionContext = {
      cwd: task.workspace.root,
      log: task.log,
      inputs: task.inputs,
      paths: {
        node: services.executables.node,
        pnpm: services.executables.pnpm,
      },
      abortSignal: task.signal,
      context: services.context,
      setArtifact: task.setArtifact,
      phase,
    };
    const result = await forge(
      "package",
      typeof appFolder === "string" ? appFolder : undefined,
      execution,
      completeConfiguration,
    );

    return result ? { output: result.folder } : {};
  };

export const electronWorkflowTaskFactories = {
  "@pipelab/plugin-electron/electron:package:v2": electronPackageWorkflowTaskFactory,
};
