import { serveCommand, type ServeOptions } from "@pipelab/core-node";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Resolve the CLI version from the injected build env, falling back to the
 * package.json next to (or one level above) the given directory.
 */
export function resolveCliVersion(cliDirname: string): string {
  const injected = process.env.CLI_VERSION || "0.0.0";
  if (injected !== "0.0.0") return injected;
  try {
    const packageJsonPath = existsSync(join(cliDirname, "package.json"))
      ? join(cliDirname, "package.json")
      : join(cliDirname, "..", "package.json");
    if (existsSync(packageJsonPath)) {
      return JSON.parse(readFileSync(packageJsonPath, "utf-8")).version;
    }
  } catch {
    console.warn("[CLI] Could not resolve version from package.json, using fallback.");
  }
  return injected;
}

export interface StartServerOptions extends ServeOptions {
  /** Directory holding the bundled `ui` and `assets` folders. */
  cliDirname: string;
  /** Defaults to the version resolved from `cliDirname`. */
  version?: string;
}

/** Start the Pipelab server (HTTP UI + WebSocket API) in the current process. */
export async function startServer({ cliDirname, version, ...options }: StartServerOptions) {
  process.env.PIPELAB_CLI_DIR ||= cliDirname;
  return serveCommand(options, version ?? resolveCliVersion(cliDirname), cliDirname);
}
