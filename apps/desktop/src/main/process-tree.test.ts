import { spawn } from "node:child_process";
import { describe, expect, it } from "vitest";
import { killProcessTree } from "./process-tree";

const isAlive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const waitFor = async (condition: () => boolean, timeoutMs = 5000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (condition()) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return condition();
};

describe.skipIf(process.platform === "win32")("killProcessTree", () => {
  it("removes descendants that outlive a crashed leader", async () => {
    // A leader that starts a long-lived grandchild and reports its pid.
    const leader = spawn(
      process.execPath,
      [
        "-e",
        `const c = require("node:child_process").spawn(process.execPath, ["-e", "setInterval(()=>{},1000)"], { stdio: "ignore" });
         process.stdout.write(String(c.pid) + "\\n"); setInterval(() => {}, 1000);`,
      ],
      { detached: true, stdio: ["ignore", "pipe", "ignore"] },
    );
    const grandchildPid = await new Promise<number>((resolve) =>
      leader.stdout!.once("data", (chunk: Buffer) => resolve(Number(chunk.toString().trim()))),
    );
    expect(isAlive(grandchildPid)).toBe(true);

    // Crash the leader: the grandchild is orphaned and survives.
    leader.kill("SIGKILL");
    await new Promise((resolve) => leader.once("exit", resolve));
    expect(isAlive(grandchildPid)).toBe(true);

    killProcessTree(leader.pid);
    expect(await waitFor(() => !isAlive(grandchildPid))).toBe(true);
  });
});
