import type { UserConfig } from "vite";
import { defineConfig, loadEnv, mergeConfig } from "vite";
import { getBuildConfig, external } from "./vite.base.config.mts";
import { resolve } from "path";

// https://vitejs.dev/config
export default defineConfig((env) => {
  const rootPath = resolve(__dirname, "../../");
  const environment = loadEnv(env.mode, rootPath, "");

  const config: UserConfig = {
    envDir: rootPath,
    build: {
      sourcemap: true,
      rollupOptions: {
        input: "src/main.ts",
        output: {
          format: "cjs",
          entryFileNames: "[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: "[name].[ext]",
        },
        external: [
          ...external,
          "bufferutil",
          "utf-8-validate",
          "playwright",
          "playwright-core",
          // Load the native addon from the packaged app's dependencies.
          "@napi-rs/keyring",
        ],
      },
    },
    define: {
      // Vite replaces `process.env` with `{}` in non-library builds, which would blank every
      // runtime environment read in the Electron main process. Keep the real environment.
      "process.env": "process.env",
      "global.process.env": "global.process.env",
      "globalThis.process.env": "globalThis.process.env",
      "process.env.POSTHOG_API_KEY": JSON.stringify(environment.POSTHOG_API_KEY),
      "process.env.SUPABASE_URL": JSON.stringify(environment.SUPABASE_URL),
      "process.env.SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        environment.SUPABASE_PUBLISHABLE_KEY || "",
      ),
      "process.env.PIPELAB_CLOUD_WORKER_URL": JSON.stringify(environment.PIPELAB_CLOUD_WORKER_URL),
    },
    resolve: {
      // Load the Node.js entry.
      mainFields: ["module", "jsnext:main", "jsnext"],
      conditions: ["node"],
    },
  };

  return mergeConfig(getBuildConfig(), config);
});
