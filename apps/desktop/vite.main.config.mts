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
          // Cloud CLI auth uses this optional native dependency, while Desktop
          // auth comes from the authenticated bootstrap session. Leave it lazy.
          "@napi-rs/keyring",
        ],
      },
    },
    define: {
      "process.env.POSTHOG_API_KEY": JSON.stringify(environment.POSTHOG_API_KEY),
      "process.env.SUPABASE_URL": JSON.stringify(environment.SUPABASE_URL),
      // Keep the key fallback inline: the staged config cannot import TypeScript helpers.
      "process.env.SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        environment.SUPABASE_PUBLISHABLE_KEY || environment.SUPABASE_ANON_KEY || "",
      ),
      "process.env.SUPABASE_ANON_KEY": JSON.stringify(environment.SUPABASE_ANON_KEY),
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
