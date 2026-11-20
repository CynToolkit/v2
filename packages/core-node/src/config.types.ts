import type { Migrator } from "@pipelab/shared";
import type { PipelabContext } from "./context";

export interface SetupConfigFile {
  version: string;
}

export interface SetupConfigFileOptions<T extends SetupConfigFile> {
  context: PipelabContext;
  migrator: Migrator<T>;
}
