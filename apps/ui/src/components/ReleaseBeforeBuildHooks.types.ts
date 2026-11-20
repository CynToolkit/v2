import type { ReleaseBeforeBuildHook } from "@pipelab/shared";

export interface ReleaseBeforeBuildHooksProps {
  hooks: ReleaseBeforeBuildHook[];
  supported: boolean;
}

export interface ReleaseBeforeBuildHooksEmits {
  "update:hooks": [hooks: ReleaseBeforeBuildHook[]];
}
