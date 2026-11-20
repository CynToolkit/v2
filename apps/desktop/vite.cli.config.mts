import type { UserConfig } from "vite";
import { defineConfig, mergeConfig } from "vite";
import mainConfig from "./vite.main.config.mts";

// The full CLI program (`@pipelab/cli/program`), run by `Pipelab cli <args>`
// through Electron in Node mode so it needs no separate CLI install.
export default defineConfig(async (env) => {
  const base = typeof mainConfig === "function" ? await mainConfig(env) : await mainConfig;
  const config: UserConfig = {
    build: {
      rollupOptions: {
        input: "src/cli-entry.ts",
        output: {
          entryFileNames: "cli-entry.js",
          chunkFileNames: "cli-[name].js",
          assetFileNames: "cli-[name].[ext]",
        },
      },
    },
    define: {
      // NODE_ENV is chosen by whoever launches the server (Desktop passes it).
      "process.env.NODE_ENV": "process.env.NODE_ENV",
    },
  };
  return mergeConfig(base, config);
});
