import { isRecord } from "@pipelab/shared";
import { parseArgs } from "node:util";
import { startServer } from "@pipelab/cli/serve";
import { cancelAllWorkflowRuns, webSocketServer } from "@pipelab/core-node";

/**
 * Entry point of the Pipelab server bundled with Desktop. Desktop spawns it (Electron in
 * Node mode, with an IPC channel) with `--port`, `--user-data` and `--cli-dir`; it reports
 * its port to the parent and stops when asked to or when the parent goes away.
 * Standalone use from an install is `Pipelab cli serve`, which runs the CLI program.
 */
const { values } = parseArgs({
  options: {
    port: { type: "string" },
    "user-data": { type: "string" },
    "cli-dir": { type: "string" },
  },
});
const port = values.port;
const userData = values["user-data"];
const cliDirname = values["cli-dir"];
if (!port || !userData || !cliDirname) {
  console.error("[Server] Missing --port, --user-data or --cli-dir.");
  process.exit(2);
}

// Read the token Desktop generated, then drop it so workflow processes do not inherit it.
const authToken = process.env.PIPELAB_AUTH_TOKEN;
delete process.env.PIPELAB_AUTH_TOKEN;
if (!authToken) {
  console.error("[Server] Missing PIPELAB_AUTH_TOKEN.");
  process.exit(2);
}

let stopping = false;
const shutdown = async (exitCode: number) => {
  if (stopping) return;
  stopping = true;
  try {
    cancelAllWorkflowRuns();
    await webSocketServer.stop();
  } finally {
    process.exit(exitCode);
  }
};

// A crash here must never reach Desktop's main process. An uncaught exception leaves the
// process in an unknown state: log it and exit so the supervisor restarts a clean server
// (Desktop reconnects to it). A rejected background promise is not fatal: log it and keep
// serving, since the server itself is healthy.
process.on("uncaughtException", (error) => {
  console.error("[Server] Uncaught exception:", error);
  void shutdown(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled background error (the server keeps running):", reason);
});

process.on("message", (message) => {
  if (isRecord(message) && message.type === "shutdown") void shutdown(0);
});
// Desktop went away without asking us to stop: do not keep running unsupervised.
process.on("disconnect", () => void shutdown(0));

// The Desktop server is only ever reachable from this machine.
startServer({ port, host: "127.0.0.1", userData, cliDirname, authToken, desktopHosted: true })
  .then(({ port }) => process.send?.({ type: "ready", port }))
  .catch((error: unknown) => {
    console.error("[Server] Failed to start:", error);
    process.exit(1);
  });
