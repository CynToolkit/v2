import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createProviderDefinition } from "@pipelab/shared";
import type { WorkflowTask } from "@pipelab/workflow-runtime";
import type { ReleaseProducerDefinition, ReleaseSourceDefinition } from "@pipelab/shared";
import {
  exportGodotProject,
  findGodotExecutable,
  godotPresetMatchesTarget,
  hasGodotTemplates,
} from "./export";
import {
  godotExporterDescriptor,
  godotMetadata,
  godotSourceDescriptor,
  targetDescriptors,
} from "./metadata";
import type { PresetInfoForProjectResult } from "./index.types";

const descriptorFor = (targetId: string) => {
  const descriptor = Object.entries(targetDescriptors).find(([id]) => id === targetId)?.[1];
  if (!descriptor) throw new Error(`Unknown Godot target: ${targetId}`);
  return descriptor;
};

const presetInfoForProject = (projectPath: string, preset: string): PresetInfoForProjectResult => {
  try {
    const config = readFileSync(join(projectPath, "export_presets.cfg"), "utf8");
    for (const section of config.split(/(?=^\[preset\.\d+\]\s*$)/m)) {
      const name = section.match(/^name\s*=\s*"([^"]+)"/m)?.[1];
      if (name === preset)
        return {
          found: true,
          checked: true,
          platform: section.match(/^platform\s*=\s*"([^"]+)"/m)?.[1],
        };
    }
  } catch {
    return { found: false, checked: false };
  }
  return { found: false, checked: true };
};

const inspect = async (path: string) => {
  const project = await readFile(join(path, "project.godot"), "utf8");
  const projectName = project.match(/^config\/name\s*=\s*"([^"]+)"/m)?.[1] || "Godot project";
  const presets: string[] = [];
  const presetPlatforms: Record<string, string> = {};
  try {
    const config = await readFile(join(path, "export_presets.cfg"), "utf8");
    for (const section of config.split(/(?=^\[preset\.\d+\]\s*$)/m)) {
      const name = section.match(/^name\s*=\s*"([^"]+)"/m)?.[1];
      const platform = section.match(/^platform\s*=\s*"([^"]+)"/m)?.[1];
      if (name) {
        presets.push(name);
        if (platform) presetPlatforms[name] = platform;
      }
    }
  } catch {
    /* Presets are reported as missing through issues. */
  }
  let godotVersion: string | undefined;
  const executable: string | undefined = findGodotExecutable();
  if (executable)
    try {
      godotVersion = execFileSync(executable, ["--version"], {
        encoding: "utf8",
        timeout: 3000,
      }).trim();
    } catch {
      /* Version is optional metadata. */
    }
  let templatesAvailable = false;
  templatesAvailable = await hasGodotTemplates(process.platform);
  return {
    metadata: { projectName, godotVersion },
    data: { executable, templatesAvailable, presets, presetPlatforms },
    fieldOptions: {
      preset: presets.map((preset) => ({
        label: preset,
        value: preset,
        metadata: { platform: presetPlatforms[preset] },
      })),
    },
    issues: [
      ...(!executable
        ? [
            {
              code: "godot.executable.missing",
              message: "Godot executable not found.",
              severity: "error" as const,
            },
          ]
        : []),
      ...(!templatesAvailable
        ? [
            {
              code: "godot.templates.missing",
              message: "Godot export templates are missing.",
              severity: "warning" as const,
            },
          ]
        : []),
    ],
  };
};

export const godotSource: ReleaseSourceDefinition = {
  ...godotSourceDescriptor,
  validate: (config) =>
    typeof config.path === "string" && config.path
      ? []
      : [
          {
            code: "source.path.required",
            message: "A project path is required.",
            severity: "error",
            path: "path",
          },
        ],
  inspect: async (config) => {
    const result = await inspect(String(config.path || ""));
    return {
      ...result,
      fieldValues: result.data?.executable
        ? { "source.executable": result.data.executable }
        : undefined,
    };
  },
  compile: (config) => ({
    steps: [
      {
        id: "release-godot-source",
        uses: "@pipelab/core/passthrough",
        with: { path: config.path },
        artifacts: { output: { descriptor: godotSource.output } },
      },
    ],
    artifact: {
      reference: { stepId: "release-godot-source", artifact: "output" },
      descriptor: godotSource.output,
    },
  }),
};

export const godotExportTask: WorkflowTask = async (data) => {
  const inputs = data.inputs;
  const project = String(inputs.project || "");
  const preset = String(inputs.preset || "").trim();
  const target = String(inputs.target || "");
  if (!project || !preset) throw new Error("Godot export requires a project folder and preset.");
  const result = await exportGodotProject({
    executable: String(inputs.executable || findGodotExecutable() || "godot"),
    project,
    preset,
    platform: target.startsWith("windows")
      ? "windows"
      : target.startsWith("linux")
        ? "linux"
        : target.startsWith("macos")
          ? "macos"
          : "web",
    projectName: String(inputs.projectName || "game"),
    outputDirectory: join(data.workspace.root, ".pipelab-godot", target),
    signal: data.signal,
    log: data.logStream,
    ensureDirectory: data.filesystem.ensureDirectory,
  });
  data.setArtifact("output", result.path, { checksum: result.checksum, size: result.size });
  return { output: result.path };
};

export const godotExporter: ReleaseProducerDefinition = {
  ...godotExporterDescriptor,
  validate: (config, context) =>
    config.targets
      .filter((target) => target.enabled)
      .flatMap((target) => {
        const preset = String(target.config.preset || "").trim();
        if (!preset)
          return [
            {
              code: "godot.preset.required",
              message: `Choose a preset for ${target.id}.`,
              severity: "error" as const,
              path: `targets.${target.id}.config.preset`,
            },
          ];
        const presetInfo = context.sourceConfig?.path
          ? presetInfoForProject(String(context.sourceConfig.path), preset)
          : { found: true, checked: false };
        if (presetInfo.checked && !presetInfo.found)
          return [
            {
              code: "godot.preset.unknown",
              message: `Preset ${preset} does not exist in export_presets.cfg.`,
              severity: "error" as const,
              path: `targets.${target.id}.config.preset`,
            },
          ];
        return presetInfo.platform && !godotPresetMatchesTarget(presetInfo.platform, target.id)
          ? [
              {
                code: "godot.preset.target-mismatch",
                message: `Preset ${preset} does not match target ${target.id}.`,
                severity: "error" as const,
                path: `targets.${target.id}.config.preset`,
              },
            ]
          : [];
      }),
  inspect: async (config, context) => {
    const sourcePath = String(context.sourceConfig?.path || "").trim();
    if (!sourcePath)
      return {
        issues: config.targets
          .filter((target) => target.enabled)
          .map((target) => ({
            code: "godot.preset.required",
            message: `Choose a preset for ${target.id}.`,
            severity: "error" as const,
            path: `targets.${target.id}.config.preset`,
          })),
      };

    const sourceInspection = await inspect(sourcePath);
    const options = sourceInspection.fieldOptions?.preset || [];
    const fieldValues: Record<string, unknown> = {};
    const issues = [
      ...sourceInspection.issues,
      ...config.targets
        .filter((target) => target.enabled)
        .flatMap((target) => {
          if (String(target.config.preset || "").trim()) return [];
          const matchingPreset = options.find((option) => {
            const platform = String(option.metadata?.platform || "");
            return platform && godotPresetMatchesTarget(platform, target.id);
          });
          if (matchingPreset) {
            fieldValues[`targets.${target.id}.config.preset`] = matchingPreset.value;
            return [];
          }
          return [
            {
              code: "godot.preset.required",
              message: `Choose a preset for ${target.id}.`,
              severity: "error" as const,
              path: `targets.${target.id}.config.preset`,
            },
          ];
        }),
    ];

    return {
      data: sourceInspection.data,
      fieldOptions: sourceInspection.fieldOptions,
      fieldValues,
      issues,
    };
  },
  compile: (input, config) => ({
    steps: config.targets
      .filter((target) => target.enabled)
      .map((target) => ({
        id: `${config.id}-${target.id}`,
        uses: "@pipelab/plugin-godot/godot:export",
        needs: [input.reference.stepId],
        artifactInputs: { project: input.reference },
        with: {
          preset: target.config.preset,
          target: target.id,
          executable: config.config.executable || findGodotExecutable(),
        },
        artifacts: {
          output: { descriptor: descriptorFor(target.id) },
        },
      })),
    artifacts: Object.fromEntries(
      config.targets
        .filter((target) => target.enabled)
        .map((target) => [
          target.id,
          {
            reference: { stepId: `${config.id}-${target.id}`, artifact: "output" },
            descriptor: descriptorFor(target.id),
          },
        ]),
    ),
  }),
};

export const provider = createProviderDefinition({
  ...godotMetadata,
  release: { sources: [godotSource], producers: [godotExporter] },
  workflowTasks: {
    "@pipelab/plugin-godot/godot:export": () => godotExportTask,
  },
});

export const workflowTasks = {
  "@pipelab/plugin-godot/godot:export":
    provider.workflowTasks["@pipelab/plugin-godot/godot:export"](),
};
export default provider;
