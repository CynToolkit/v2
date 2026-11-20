export interface ListWorkflowsCommandOptions {
  userData?: string;
}

export interface DeleteWorkflowCommandOptions {
  force?: boolean;
  userData?: string;
}

export interface RunWorkflowCommandOptions {
  userData?: string;
  output?: string;
  failOnError?: boolean;
  dryRun?: boolean;
  skipPreflight?: boolean;
  skipPersistence?: boolean;
  verbose?: boolean;
  connection?: readonly string[];
}

export interface RunCompletion {
  resolve: () => void;
  reject: (error: Error) => void;
}

export interface WorkflowLogs {
  stepTitle: string;
  message: string;
}
