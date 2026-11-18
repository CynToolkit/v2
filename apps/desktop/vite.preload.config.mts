import type { UserConfig } from "vite";
import { defineConfig, mergeConfig } from "vite";
import { getBuildConfig, external } from "./vite.base.config.mts";

// https://vitejs.dev/config
export default defineConfig(() => {
  const config: UserConfig = {
    build: {
      rollupOptions: {
        external: external,
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: "src/preload.ts",
        output: {
          format: "cjs",
          // It should not be split chunks.
          inlineDynamicImports: true,
          entryFileNames: "[name].cjs",
          chunkFileNames: "[name].js",
          assetFileNames: "[name].[ext]",
        },
      },
    },
  };

  return mergeConfig(getBuildConfig(), config);
});
