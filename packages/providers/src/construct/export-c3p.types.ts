export interface ConstructWorkflowTaskServicesContext {
  getThirdPartyPath(...subpaths: string[]): string;
}

export interface ConstructWorkflowTaskServicesRun {
  projectId: string;
}
