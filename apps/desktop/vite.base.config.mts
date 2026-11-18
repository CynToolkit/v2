import { builtinModules } from "node:module";
import type { UserConfig } from "vite";

// The main and preload bundles contain all of their dependencies, so only
// Electron and Node built-ins stay external.
export const external = ["electron", ...builtinModules.flatMap((m) => [m, `node:${m}`])];

export function getBuildConfig(): UserConfig {
  return {
    build: {
      // Main and preload build into the same directory.
      emptyOutDir: false,
      outDir: ".vite/build",
      minify: true,
    },
    clearScreen: false,
  };
}
