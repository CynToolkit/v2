export interface ReleaseFlowProps {
  dashboardMode?: boolean;
  dashboardFlowId?: string;
  dashboardProjectId?: string;
}

export interface ReleaseFlowEmits {
  closeDashboard: [];
}

export interface PendingBlockerConnection {
  code: string;
  message: string;
  path: string;
  flowId: string;
  projectId: string;
  integration: string;
}

export interface NewBuildTarget {
  destinationId: string;
  slotId: string;
}

export interface ShipOptions {
  skipPreflight?: boolean;
}
