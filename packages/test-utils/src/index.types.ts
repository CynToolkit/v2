export interface MockBinaryOptions {
  extension?: string | false;
}

export interface RunCLIOptions {
  cwd?: string;
  env?: Record<string, string>;
}

export interface RunWorkflowTaskServicesOption {
  services?: unknown;
}

export interface RunElectronAppOptions {
  timeoutMs?: number;
}
