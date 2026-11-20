export interface InstallUpdateAfterServerStopsOptions {
  stopServer: () => Promise<void>;
  quitAndInstall: () => void;
  setInstalling: (installing: boolean) => void;
  onFailure: (error: unknown) => void;
}
