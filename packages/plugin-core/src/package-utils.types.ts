import type { ProviderHostContext } from "./pipelab";

export interface FetchPackageResult {
  packageDir: string;
  resolvedVersion: string;
  isLocal?: boolean;
  entryPoint?: string;
}

export interface RunPnpmOptions {
  args?: string[];
  extraEnv?: Record<string, string>;
  signal?: AbortSignal;
  context: ProviderHostContext;
}
