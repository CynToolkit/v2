import {
  checkPokiPreflight,
  testPokiConnection,
  createPokiUploadTask,
  WORKFLOW_TASK_ID,
  type PokiTaskServices,
} from "./export";

import { createProviderDefinition } from "@pipelab/shared";
import type { ReleaseDestinationDefinition } from "@pipelab/shared";
import { pokiDestinationDescriptor, pokiMetadata } from "./metadata";

export { createPokiUploadTask, WORKFLOW_TASK_ID };

const pokiDestination: ReleaseDestinationDefinition = {
  ...pokiDestinationDescriptor,
  validate: (config) =>
    ["project"]
      .filter((key) => !String(config.config[key] || "").trim())
      .map((key) => ({
        code: `poki.${key}.required`,
        message: `Poki ${key} is required.`,
        severity: "error" as const,
        path: `config.${key}`,
      })),
  compile: (artifact, destination, slot, context) => {
    const version = String(context.variables?.version ?? "");
    const notes = String(context.variables?.releaseNotes ?? "").trim() || version;
    return [
      {
        id: `poki-${destination.id}-${slot.id}`,
        uses: WORKFLOW_TASK_ID,
        needs: [artifact.reference.stepId],
        artifactInputs: { "input-folder": artifact.reference },
        with: { ...destination.config, ...slot.config, name: version, notes },
        delivery: {
          destinationId: destination.id,
          slotId: slot.id,
          artifact: artifact.reference,
        },
      },
    ];
  },
};

export const provider = createProviderDefinition({
  ...pokiMetadata,
  release: { destinations: [pokiDestination] },
  connectionTests: { "@pipelab/plugin-poki": testPokiConnection },
  preflights: { [WORKFLOW_TASK_ID]: checkPokiPreflight },
  workflowTasks: {
    [WORKFLOW_TASK_ID]: (services: PokiTaskServices) => createPokiUploadTask(services),
  },
});

export default provider;
