/// <reference path="./declarations.d.ts" />
import { createProviderDefinition } from "@pipelab/shared";
import type { ReleaseProducerDefinition } from "@pipelab/shared";
import { electronWorkflowTaskFactories } from "./package-v2";
import { electronPhases } from "./phases";
import { electronMetadata, electronProducerDescriptor, electronTargetInputs } from "./metadata";

export { electronTargetInputs };

const electronProducer: ReleaseProducerDefinition = {
  ...electronProducerDescriptor,
  validate: () => [],
  compile: (input, config) => ({
    steps: config.targets
      .filter((target) => target.enabled)
      .map((target) => ({
        id: `${config.id}-${target.id}`,
        uses: "@pipelab/plugin-electron/electron:package:v2",
        phases: electronPhases,
        needs: [input.reference.stepId],
        artifactInputs: { "input-folder": input.reference },
        with: { ...config.config, ...target.config, ...electronTargetInputs(target.id) },
        artifacts: {
          "electron-build": {
            descriptor: electronProducer.targets.find((candidate) => candidate.id === target.id)!
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
            reference: { stepId: `${config.id}-${target.id}`, artifact: "electron-build" },
            descriptor: electronProducer.targets.find((candidate) => candidate.id === target.id)!
              .output!,
          },
        ]),
    ),
  }),
};

export const provider = createProviderDefinition({
  ...electronMetadata,
  release: { producers: [electronProducer] },
  workflowTasks: electronWorkflowTaskFactories,
});

export { electronWorkflowTaskFactories };
export default provider;
