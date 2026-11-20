import type { ChildProcess } from "node:child_process";

export interface SpawnServerResult {
  child: ChildProcess;
  port: number;
}
