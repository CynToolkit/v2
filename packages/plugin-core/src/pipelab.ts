/** Host services needed by built-in providers; implemented by the CLI host. */
export interface ProviderHostContext {
  readonly releaseTag: string;
  getPackagesPath(...segments: string[]): string;
  getThirdPartyPath(...segments: string[]): string;
  getTempPath(...segments: string[]): string;
  createTempFolder(prefix?: string): Promise<string>;
  getCachePath(folder?: "pipelines" | "pacote", ...segments: string[]): string;
  getPnpmPath(...segments: string[]): string;
  getNodePath(version?: string): string;
  getConnectionsPath(): string;
  ensureNodeJS(): Promise<string>;
  ensurePNPM(): Promise<string>;
  resolveBundledAsset(packageName: string): Promise<string>;
}

/** Absolute paths to the Node.js and pnpm binaries a task runs with. */
export interface ProviderExecutables {
  node: string;
  pnpm: string;
}

/** A packaged desktop app: its folder, and the launchable binary once one was found. */
export interface PackagedApp {
  folder: string;
  binary: string | undefined;
}

/** The platform and architecture a desktop target is built for. */
export interface DesktopTargetInputs {
  platform: "win32" | "linux" | "darwin";
  arch: "x64" | "arm64";
}

/**
 * Provider-facing compatibility alias for ProviderHostContext.
 * This is a structural type, not the concrete PipelabContext class from core-node.
 */
export type PipelabContext = ProviderHostContext;

export * from "@pipelab/shared";

export const sleep = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));
