import type { UserConfig } from "vite";
import { defineConfig, mergeConfig } from "vite";
import mainConfig from "./vite.main.config.mts";

// The CLI server bundle: imports `@pipelab/cli/serve` and runs either inside an
// Electron utilityProcess (spawned by the main process) or standalone through
// `ELECTRON_RUN_AS_NODE=1 <Pipelab executable> server-entry.js`.
export default defineConfig(async (env) => {
  const base = typeof mainConfig === "function" ? await mainConfig(env) : await mainConfig;
  const config: UserConfig = {
    build: {
      rollupOptions: {
        input: "src/server-entry.ts",
        output: {
          entryFileNames: "server-entry.js",
          chunkFileNames: "server-[name].js",
          assetFileNames: "server-[name].[ext]",
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
