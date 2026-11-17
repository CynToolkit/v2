import { fetchPackage, type ProviderHostContext } from "@pipelab/plugin-core";
import { createRequire } from "node:module";
import { join } from "node:path";

/** Resolve the cached automation runtime only when a Construct operation needs it. */
export async function loadConstructPlaywright(context: ProviderHostContext) {
  const { packageDir } = await fetchPackage("playwright-core", "1.62.1", {
    installDeps: true,
    context,
  });
  process.env.PLAYWRIGHT_BROWSERS_PATH ||= context.getThirdPartyPath("playwright-browsers");

  // Absolute paths work in both the CLI and Electron's CommonJS bundle.
  const require = createRequire(join(packageDir, "package.json"));
  const playwright: typeof import("playwright") = require(join(packageDir, "index.js"));
  return { packageDir, playwright };
}
