import { isRecord } from "@pipelab/shared";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { app, dialog } from "electron";
import { is } from "@electron-toolkit/utils";
import http from "node:http";
import { join } from "node:path";
import { uiDevPort, getUiDevServerFatalError } from "@pipelab/constants";
import { getDefaultUserDataPath, projectRoot } from "@pipelab/core-node/desktop";
import { killProcessTree } from "./process-tree";
import type { SpawnServerResult } from "./server-process.types";

const READY_TIMEOUT_MS = 60_000;
const STOP_TIMEOUT_MS = 10_000;
const RECOVERY_TIMEOUT_MS = 30_000;
const LOAD_ATTEMPTS = 5;
const MAX_RESTARTS = 5;
const RESTART_WINDOW_MS = 60_000;

// One secret per Desktop launch, kept across server restarts so an open window can reconnect.
// It reaches the server through its environment (argv is visible to other users in `ps`).
const authToken = randomBytes(32).toString("hex");

/** URL of the UI served by the local server (or the Vite dev server in development). */
export const getUiUrl = (port: number) => {
  const base = is.dev
    ? `http://127.0.0.1:${getUiDevelopmentPort()}/?cliPort=${port}`
    : `http://127.0.0.1:${port}`;
  // In the hash so it is never sent to a server or leaked through a Referer header.
  return `${base}#token=${authToken}`;
};

/** Origins the Desktop renderer may be served from: the local server and, in development, Vite. */
export const getTrustedUiOrigins = (): string[] => {
  const origins: string[] = [];
  if (serverPort !== null) origins.push(`http://127.0.0.1:${serverPort}`);
  if (is.dev) origins.push(`http://127.0.0.1:${getUiDevelopmentPort()}`);
  return origins;
};

let serverProcess: ChildProcess | null = null;
let serverPort: number | null = null;
let startingServer: Promise<number> | null = null;
let stopping = false;
let restartTimes: number[] = [];
let restartListener: ((port: number) => void) | undefined;

/** Called after the server crashed and was restarted, so the window can reconnect. */
export const onServerRestarted = (listener: (port: number) => void) => {
  restartListener = listener;
};

const getUiDevelopmentPort = () => {
  const testPort = process.env.PIPELAB_TEST_DESKTOP_UI_PORT;
  if (process.env.PIPELAB_TEST_DESKTOP === "1" && testPort && /^\d+$/.test(testPort)) {
    return Number(testPort);
  }
  return uiDevPort;
};

const isUp = (
  port: number,
  delay = 1000,
  shouldContinue?: () => boolean,
  silent = false,
): Promise<boolean> =>
  new Promise<boolean>((resolve) => {
    const attempt = () => {
      const req = http.get(`http://127.0.0.1:${port}`, (res) => {
        res.resume();
        if (!silent) console.info(`[Server Check] Server is up on port ${port}`);
        resolve(true);
      });

      req.on("error", () => {
        if (!shouldContinue || shouldContinue()) {
          if (!silent) {
            console.info(`[Server Check] Waiting for server on port ${port}...`);
          }
          setTimeout(attempt, delay);
        } else {
          if (!silent) {
            console.error(`[Server Check] Server check aborted for port ${port}`);
          }
          resolve(false);
        }
      });
    };
    attempt();
  });

/** Directory holding the UI and asset templates the server serves. */
const getCliDirectory = () =>
  is.dev && projectRoot ? join(projectRoot, "apps", "cli") : join(app.getAppPath(), "dist", "cli");

const spawnServer = (preferredPort: number): Promise<SpawnServerResult> => {
  const releaseTag = app.getVersion().includes("beta") ? "beta" : "latest";
  const userDataPath =
    (process.env.PIPELAB_TEST_DESKTOP === "1" && process.env.PIPELAB_TEST_DESKTOP_USER_DATA_PATH) ||
    getDefaultUserDataPath(releaseTag === "beta" ? "beta" : "prod");

  const args = [
    join(app.getAppPath(), ".vite", "build", "server-entry.js"),
    "--port",
    String(preferredPort),
    "--user-data",
    userDataPath,
    "--cli-dir",
    getCliDirectory(),
  ];

  // The server is the CLI package bundled into server-entry.js. It runs in its own process
  // (a crash cannot take the main process down) and, on Unix, as its own process group
  // leader so everything it starts can be cleaned up with killProcessTree.
  const child = spawn(process.execPath, args, {
    detached: process.platform !== "win32",
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      PIPELAB_AUTH_TOKEN: authToken,
      NODE_ENV: is.dev ? "development" : "production",
    },
  });
  child.stdout?.on("data", (chunk: Buffer) => process.stdout.write(chunk));
  child.stderr?.on("data", (chunk: Buffer) => process.stderr.write(chunk));

  return new Promise((resolve, reject) => {
    const fail = (error: Error) => {
      clearTimeout(timeout);
      killProcessTree(child.pid);
      reject(error);
    };
    const timeout = setTimeout(
      () => fail(new Error("The server did not become ready in time.")),
      READY_TIMEOUT_MS,
    );
    child.on("message", (message: unknown) => {
      if (!isRecord(message) || message.type !== "ready" || typeof message.port !== "number")
        return;
      clearTimeout(timeout);
      resolve({ child, port: message.port });
    });
    child.once("error", fail);
    child.once("exit", (code) =>
      fail(new Error(`The server exited during startup (code ${code}).`)),
    );
  });
};

const launchServer = async (): Promise<number> => {
  // In dev mode, ensure UI dev server is running BEFORE anything else
  if (is.dev) {
    let retries = 5;
    const developmentPort = getUiDevelopmentPort();
    const isUIUp = await isUp(developmentPort, 500, () => retries-- > 0, true);
    if (!isUIUp) {
      console.error(getUiDevServerFatalError(developmentPort));
      throw new Error("UI dev server not found. App cannot start in development mode.");
    }
  }

  stopping = false;
  // Port 0 lets the OS pick a free loopback port for every launch.
  const { child, port } = await spawnServer(0);
  watchServer(child, port);
  serverProcess = child;
  serverPort = port;
  console.info(`[Server] CLI server is ready on loopback port ${port}`);
  return port;
};

/** Restart the server when it exits unexpectedly. */
const watchServer = (child: ChildProcess, port: number) => {
  child.once("exit", (code) => {
    if (serverProcess !== child || stopping) return;
    console.error(`[Server] CLI server exited unexpectedly (code ${code}). Restarting.`);
    // Remove whatever the crashed server left running (workflow builds, helpers).
    killProcessTree(child.pid);
    serverProcess = null;
    serverPort = null;
    void recoverServer(port);
  });
};

const recoverServer = async (previousPort: number) => {
  const now = Date.now();
  restartTimes = [...restartTimes.filter((time) => now - time < RESTART_WINDOW_MS), now];
  if (restartTimes.length > MAX_RESTARTS) {
    dialog.showErrorBox(
      "Server Error",
      "The Pipelab background server keeps crashing, so Pipelab will close.\n\n" +
        "Restart the application. If this happens again, start Pipelab from a terminal and " +
        "report the '[Server]' error lines it prints.",
    );
    app.quit();
    return;
  }
  // Prefer the previous port so the open window keeps its address; fall back to a free one.
  for (const preferredPort of [previousPort, 0]) {
    try {
      const { child, port } = await spawnServer(preferredPort);
      if (stopping) {
        child.kill();
        return;
      }
      watchServer(child, port);
      serverProcess = child;
      serverPort = port;
      console.info(`[Server] CLI server recovered on loopback port ${port}`);
      restartListener?.(port);
      return;
    } catch (error) {
      console.error("[Server] Restart attempt failed:", error);
    }
  }
  void recoverServer(0);
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Port of the running server; waits while a crashed server is being restarted. */
const waitForServerPort = async (timeoutMs = RECOVERY_TIMEOUT_MS): Promise<number> => {
  const deadline = Date.now() + timeoutMs;
  while (serverPort === null) {
    if (stopping || Date.now() > deadline) {
      throw new Error("The background server stopped and could not be restarted.");
    }
    await wait(100);
  }
  return serverPort;
};

const isConnectionFailure = (error: unknown) =>
  isRecord(error) && error.code === "ERR_CONNECTION_REFUSED";

/**
 * Load the UI from the running server. The server can exit just after reporting ready (the
 * supervisor then restarts it), so a refused connection waits for the restart and retries
 * instead of failing startup.
 */
export const loadServerUi = async (load: (url: string) => Promise<void>): Promise<void> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= LOAD_ATTEMPTS; attempt++) {
    const port = await waitForServerPort();
    try {
      await load(getUiUrl(port));
      return;
    } catch (error) {
      if (!isConnectionFailure(error)) throw error;
      lastError = error;
      console.warn(`[Server] UI load refused on port ${port} (attempt ${attempt}); retrying.`);
      await wait(500);
    }
  }
  throw lastError;
};

export const startServer = async (): Promise<number> => {
  if (serverPort !== null) return serverPort;
  startingServer ??= launchServer().finally(() => {
    startingServer = null;
  });
  return startingServer;
};

export const stopServer = async () => {
  const child = serverProcess;
  stopping = true;
  if (!child) return;
  serverProcess = null;
  serverPort = null;
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, STOP_TIMEOUT_MS);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    // Lets the server cancel in-flight workflow runs before it exits.
    if (child.connected) child.send({ type: "shutdown" });
    else resolve();
  });
  // Whether it exited gracefully or not, leave nothing of the server behind.
  killProcessTree(child.pid);
};
