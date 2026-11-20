import { isRecord } from "../guards";
import { object, string, optional, InferOutput, literal, array } from "valibot";
import { isSafePersistedId } from "../persisted-id";

export const FileRepoProjectValidator = object({
  id: string(),
  name: string(),
  description: string(),
});

export const SaveLocationWorkflowValidator = object({
  id: string(),
  project: string(),
  lastModified: string(),
  type: literal("internal-workflow"),
  configName: string(),
});

export const FileRepoValidator = object({
  version: literal("1.0.0"),
  projects: array(FileRepoProjectValidator),
  workflows: optional(array(SaveLocationWorkflowValidator), []),
});

export type SaveLocationWorkflow = InferOutput<typeof SaveLocationWorkflowValidator>;
export type FileRepo = InferOutput<typeof FileRepoValidator>;

export class FileRepoParseError extends Error {
  constructor(public readonly issues: string[]) {
    super(issues.join(" "));
    this.name = "FileRepoParseError";
  }
}

const assertFileRepo: (value: unknown) => asserts value is FileRepo = (value) => {
  const issues: string[] = [];
  if (!isRecord(value)) throw new FileRepoParseError(["Project index must be an object."]);
  const record = value;
  if (record.version !== "1.0.0") issues.push("Only project index version 1.0.0 is supported.");
  if (!Array.isArray(record.projects)) issues.push("projects must be an array.");
  if (record.workflows !== undefined && !Array.isArray(record.workflows))
    issues.push("workflows must be an array.");
  const projectIds = new Set<string>();
  for (const [index, project] of (Array.isArray(record.projects)
    ? record.projects
    : []
  ).entries()) {
    if (!isRecord(project)) {
      issues.push(`projects.${index} must be an object.`);
      continue;
    }
    const candidate = project;
    for (const key of ["id", "name"])
      if (typeof candidate[key] !== "string" || candidate[key].trim().length === 0)
        issues.push(`projects.${index}.${key} must be non-empty.`);
    if (typeof candidate.description !== "string")
      issues.push(`projects.${index}.description must be a string.`);
    if (typeof candidate.id === "string") {
      if (!isSafePersistedId(candidate.id))
        issues.push(`projects.${index}.id must be a safe non-empty persisted ID.`);
      if (projectIds.has(candidate.id)) issues.push(`Project ID '${candidate.id}' is duplicated.`);
      projectIds.add(candidate.id);
    }
  }
  const workflowIds = new Set<string>();
  for (const [index, workflow] of (Array.isArray(record.workflows)
    ? record.workflows
    : []
  ).entries()) {
    if (!isRecord(workflow)) {
      issues.push(`workflows.${index} must be an object.`);
      continue;
    }
    const candidate = workflow;
    for (const key of ["id", "project", "lastModified", "configName"])
      if (typeof candidate[key] !== "string" || candidate[key].trim().length === 0)
        issues.push(`workflows.${index}.${key} must be non-empty.`);
    if (candidate.type !== "internal-workflow")
      issues.push(`workflows.${index}.type must be 'internal-workflow'.`);
    if (typeof candidate.id === "string") {
      if (!isSafePersistedId(candidate.id))
        issues.push(`workflows.${index}.id must be a safe non-empty persisted ID.`);
      if (workflowIds.has(candidate.id))
        issues.push(`Workflow ID '${candidate.id}' is duplicated.`);
      workflowIds.add(candidate.id);
      if (candidate.configName !== `workflows/${candidate.id}`)
        issues.push(`Workflow '${candidate.id}' must use its canonical configName.`);
    }
    if (typeof candidate.project === "string" && !projectIds.has(candidate.project))
      issues.push(`Workflow '${candidate.id}' references missing project '${candidate.project}'.`);
  }
  if (issues.length > 0) throw new FileRepoParseError(issues);
};

export const parseFileRepo = (value: unknown): FileRepo => {
  assertFileRepo(value);
  return {
    version: "1.0.0",
    projects: value.projects,
    workflows: value.workflows || [],
  };
};
