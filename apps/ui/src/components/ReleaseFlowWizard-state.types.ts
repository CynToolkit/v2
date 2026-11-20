export interface ReleaseWizardCanCreateState {
  isReady: boolean;
  projectId?: string;
  canContinueDestinations: boolean;
  createPending: boolean;
  invalidEnvironmentBindingCount: number;
}
