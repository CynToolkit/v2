import { CORE_WORKFLOW_TASKS } from "@pipelab/workflow-runtime";
import type {
  CompiledArtifact,
  ReleaseCompileContext,
  ReleaseProducerConfig,
  ReleaseProducerDefinition,
} from "@pipelab/shared";
import type { WorkflowStep } from "@pipelab/workflow-runtime";
import { constructExportInputs } from "./export-inputs";
import { constructProducerDescriptor, constructTargets } from "./metadata";

export const constructProducer: ReleaseProducerDefinition = {
  ...constructProducerDescriptor,
  validate: () => [],
  compile: (
    _input: CompiledArtifact,
    config: ReleaseProducerConfig,
    context: ReleaseCompileContext,
  ) => {
    if (!context.sourceConfig)
      throw new Error("Construct export requires a Construct project source.");
    const sourceConfig = context.sourceConfig;
    const steps: WorkflowStep[] = [];
    const artifacts: Record<string, CompiledArtifact> = {};
    for (const target of config.targets.filter((item) => item.enabled)) {
      const definition = constructTargets.find((item) => item.id === target.id);
      if (!definition) throw new Error(`Unknown Construct target: ${target.id}`);
      const exportId = `${config.id}-${target.id}-export`;
      const extractId = `${config.id}-${target.id}-extract`;
      steps.push(
        {
          id: exportId,
          uses: "@pipelab/plugin-construct/export-construct-project",
          with: { ...constructExportInputs(sourceConfig), exportType: definition.exportType },
          artifacts: {
            zipFile: {
              descriptor: {
                kind: "files",
                technology: "construct",
                container: "archive",
                format: "zip",
              },
            },
          },
        },
        {
          id: extractId,
          uses: CORE_WORKFLOW_TASKS.unzip,
          needs: [exportId],
          artifactInputs: { file: { stepId: exportId, artifact: "zipFile" } },
          artifacts: { output: { descriptor: definition.output } },
        },
      );
      artifacts[target.id] = {
        reference: { stepId: extractId, artifact: "output" },
        descriptor: definition.output,
      };
    }
    return { steps, artifacts };
  },
};
