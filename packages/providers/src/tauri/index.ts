/// <reference path="./declarations.d.ts" />
import { createProviderDefinition } from "@pipelab/shared";
import type { ReleaseProducerDefinition } from "@pipelab/shared";
import { tauriWorkflowTaskFactories } from "./package";
import { tauriMetadata, tauriProducerDescriptor, tauriTargetInputs } from "./metadata";

export { tauriTargetInputs };

const tauriProducer: ReleaseProducerDefinition = {
  ...tauriProducerDescriptor,
  validate: () => [],
  compile: (input, config) => ({
    steps: config.targets
      .filter((target) => target.enabled)
      .map((target) => ({
        id: `${config.id}-${target.id}`,
        uses: "@pipelab/plugin-tauri/tauri:package:v2",
        needs: [input.reference.stepId],
        artifactInputs: { "input-folder": input.reference },
        with: { ...config.config, ...target.config, ...tauriTargetInputs(target.id) },
        artifacts: {
          output: {
            descriptor: tauriProducer.targets.find((candidate) => candidate.id === target.id)!
              .output!,
          },
        },
      })),
    artifacts: Object.fromEntries(
      config.targets
        .filter((target) => target.enabled)
        .map((target) => [
          target.id,
          {
            reference: { stepId: `${config.id}-${target.id}`, artifact: "output" },
            descriptor: tauriProducer.targets.find((candidate) => candidate.id === target.id)!
              .output!,
          },
        ]),
    ),
  }),
};

export const provider = createProviderDefinition({
  ...tauriMetadata,
  release: { producers: [tauriProducer] },
  workflowTasks: tauriWorkflowTaskFactories,
});

export { tauriWorkflowTaskFactories };
export default provider;
