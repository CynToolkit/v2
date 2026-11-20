import { spawnSync } from "node:child_process";

/**
 * Kill a process and everything it started. Unix: the process must have been
 * spawned `detached` so it leads its own process group, which stays addressable
 * after the leader died (its children are re-parented, but keep the group).
 * Windows: `taskkill /T` follows the recorded parent links, also after the parent died.
 */
export function killProcessTree(pid: number | undefined): void {
  if (!pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
    return;
  }
  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    // The group is already gone.
  }
}
