export interface WorkflowRunsSwitchProps {
  flowId: string;
  projectId: string;
  active: "runs" | "artifacts";
}
