import type { WorkflowTaskRegistry } from "@pipelab/workflow-runtime";
import type {
  WorkflowTaskFactory as BaseWorkflowTaskFactory,
  WorkflowTaskFactoryRegistry as BaseWorkflowTaskFactoryRegistry,
} from "@pipelab/shared";
import type { PipelabContext } from "./context";
import { createPipelabCloudUploadTask } from "./pipelab-cloud";
import { createCoreFilesystemWorkflowTasks } from "./workflow-tasks/filesystem";
import {
  RELEASE_BEFORE_BUILD_TASK_ID,
  releaseBeforeBuildWorkflowTask,
} from "./workflow-tasks/release-before-build";

export interface ProviderServices {
  context: PipelabContext;
  /** Node and pnpm executables ensured for this workflow run. */
  executables: { node: string; pnpm: string };
  /** Runtime-only release identifiers. Never written into workflow configuration. */
  run: {
    id: string;
    workflowId: string;
    projectId: string;
    releaseVersion: string;
  };
  /** Per-run build cache directory. Other managed directories come from context. */
  workflowCachePath: string;
}

export type WorkflowTaskFactory<TServices = ProviderServices> = BaseWorkflowTaskFactory<TServices>;
export type WorkflowTaskFactoryRegistry<TServices = ProviderServices> =
  BaseWorkflowTaskFactoryRegistry<TServices>;

export const createWorkflowTaskRegistry = <TServices>(
  factories: WorkflowTaskFactoryRegistry<TServices>,
  services: TServices,
): WorkflowTaskRegistry<TServices> =>
  Object.fromEntries(
    Object.entries(factories).map(([id, createTask]) => [id, createTask(services)]),
  );

export const createPipelabWorkflowTasks = <TServices = unknown>(
  services: ProviderServices,
  registeredTasks: WorkflowTaskRegistry<TServices>,
): WorkflowTaskRegistry<TServices> => {
  return {
    ...registeredTasks,
    ...createCoreFilesystemWorkflowTasks(),
    [RELEASE_BEFORE_BUILD_TASK_ID]: (taskContext) =>
      releaseBeforeBuildWorkflowTask({ ...taskContext, services }),
    "pipelab-cloud:upload": createPipelabCloudUploadTask(services),
  };
};

export { releaseBeforeBuildWorkflowTask } from "./workflow-tasks/release-before-build";
