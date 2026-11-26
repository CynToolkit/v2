import { app, shell, BrowserWindow, dialog, screen } from "electron";
import { autoUpdater } from "electron-updater";
import { join, resolve } from "node:path";
import { platform } from "node:os";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import {
  getTrustedUiOrigins,
  getUiUrl,
  loadServerUi,
  onServerFailed,
  onServerRestarted,
  startServer,
  stopServer,
} from "./main/server-process";
import { getProtocolName, getAppBundleId } from "@pipelab/constants";
import { getCliPassthroughArgs, runCliPassthrough } from "./main/cli-passthrough";
import { registerIpcHandlers } from "./main/ipc-handlers";
import { isExternalHttpUrl, isTrustedRendererUrl } from "./main/trusted-origin";
import { installUpdateAfterServerStops } from "./main/update-shutdown";
import { createUpdater, resolveAvailableUpdate } from "./main/updater";
import type { UpdateChannel, UpdateState } from "@pipelab/shared";
import {
  buildCoreReleaseRegistry,
  fetchLatestDesktopRelease,
  getDesktopReleaseFeedUrl,
  getDefaultUserDataPath,
  getReleaseWorkflowEnvironmentVariableNames,
  PipelabContext,
  ReleasePersistence,
} from "@pipelab/core-node/desktop";
import { PostHog } from "posthog-node";
import { parseArgs } from "node:util";
import { readWorkflowEnvironmentForWorkflow } from "./main/workflow-environment";

const isProduction = app.isPackaged && process.env.TEST !== "true";
const isE2ESmokeTest = process.env.PIPELAB_E2E === "1";
const e2eHistoryPath = process.env.PIPELAB_E2E_HISTORY_PATH;
const e2eExpectedRunCount = Number(process.env.PIPELAB_E2E_EXPECTED_RUNS || 0);
const isDesktopIntegrationTest = process.env.PIPELAB_TEST_DESKTOP === "1";
const desktopTestUserDataPath = isDesktopIntegrationTest
  ? process.env.PIPELAB_TEST_DESKTOP_USER_DATA_PATH
  : undefined;
const desktopTestDebugPort = isDesktopIntegrationTest
  ? process.env.PIPELAB_TEST_DESKTOP_DEBUG_PORT
  : undefined;

if (desktopTestDebugPort && /^\d+$/.test(desktopTestDebugPort)) {
  app.commandLine.appendSwitch("remote-debugging-address", "127.0.0.1");
  app.commandLine.appendSwitch("remote-debugging-port", desktopTestDebugPort);
}

let posthog: PostHog | undefined;
if (isProduction) {
  posthog = new PostHog(process.env.POSTHOG_API_KEY || "", {
    host: "https://eu.i.posthog.com",
  });
}

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception in Main Process:", error);
  if (posthog) {
    posthog.capture({
      distinctId: "desktop-main-process",
      event: "uncaught_exception",
      properties: {
        message: error.message,
        stack: error.stack,
        platform: process.platform,
        version: app.getVersion(),
      },
    });
  }
});

const getEnv = () => {
  if (is.dev) return "dev";
  if (app.getVersion().includes("beta")) return "beta";
  return "prod";
};

const customUserDataPath = desktopTestUserDataPath || getDefaultUserDataPath(getEnv());
app.setPath("userData", join(customUserDataPath, "desktop"));

function getIconPath() {
  let ext = ".png";
  if (platform() === "win32") ext = ".ico";
  else if (platform() === "darwin") ext = ".icns";
  return join("./assets", "build", `icon${ext}`);
}

let pendingUrl: string | null = null;

function findProtocolUrl(
  args: string[],
  values: Record<string, string | boolean | (string | boolean)[] | undefined>,
  positionals: string[],
): string | null {
  const pUrl = positionals.find(
    (arg) => arg.startsWith("pipelab://") || arg.startsWith("pipelab-beta://"),
  );
  if (pUrl) return pUrl;

  const startArgs = values["process-start-args"];
  if (typeof startArgs === "string" && startArgs) {
    if (startArgs.startsWith("pipelab://") || startArgs.startsWith("pipelab-beta://")) {
      return startArgs;
    }
    const parts = startArgs.split(/\s+/);
    const partUrl = parts.find(
      (arg) => arg.startsWith("pipelab://") || arg.startsWith("pipelab-beta://"),
    );
    if (partUrl) return partUrl;
  }

  const anyUrl = args.find(
    (arg) => arg.startsWith("pipelab://") || arg.startsWith("pipelab-beta://"),
  );
  if (anyUrl) return anyUrl;

  return null;
}

function handleProtocolUrl(url: string) {
  if (!url) return;
  console.info(`[Main] Handling protocol URL: ${url}`);
  if (mainWindow && !mainWindow.webContents.isLoading()) {
    mainWindow.webContents.send("protocol-url", url);
  } else {
    pendingUrl = url;
  }
}

// Register macOS open-url handler
app.on("open-url", (event, url) => {
  event.preventDefault();
  handleProtocolUrl(url);
});

// `Pipelab cli <any CLI command and options>` runs the bundled CLI program and exits.
const cliPassthroughArgs = getCliPassthroughArgs(process.argv, is.dev);
if (cliPassthroughArgs) runCliPassthrough(cliPassthroughArgs);

// Single Instance Lock setup (a CLI run must not be absorbed by a running Desktop)
const gotTheLock = cliPassthroughArgs ? true : app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.info("[Main] Another instance is already running. Quitting.");
  app.exit(0);
} else {
  app.on("second-instance", (event, commandLine) => {
    console.info(`[Main] Second instance started with command line: ${commandLine.join(" ")}`);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    try {
      const config = {
        options: {
          "process-start-args": { type: "string" as const },
        },
        strict: false,
      };
      const { values, positionals } = parseArgs({
        ...config,
        args: commandLine.slice(1),
      });

      const url = findProtocolUrl(commandLine, values, positionals);
      if (url) {
        handleProtocolUrl(url);
      }
    } catch (err) {
      console.error("[Main] Failed to parse second-instance arguments:", err);
    }
  });
}

let mainWindow: BrowserWindow | undefined;
let shutdownPromise: Promise<void> | undefined;
let installingUpdate = false;

function stopServerOnce(): Promise<void> {
  if (!shutdownPromise) {
    shutdownPromise = stopServer().finally(() => {
      shutdownPromise = undefined;
    });
  }
  return shutdownPromise;
}

function handleShutdownFailure(error: unknown): void {
  console.error("Failed to stop the CLI server:", error);
  dialog.showErrorBox(
    "Shutdown Error",
    "Pipelab could not confirm that its local server stopped. The application will stay open so cleanup can be retried.",
  );
  void restoreWindowAfterFailedShutdown().catch((restoreError: unknown) =>
    console.error("Failed to restore the Desktop window after shutdown error:", restoreError),
  );
}

async function relaunchAfterServerStops(): Promise<void> {
  try {
    await stopServerOnce();
    app.relaunch();
    app.exit(0);
  } catch (error) {
    handleShutdownFailure(error);
    throw error;
  }
}

async function installDownloadedUpdate(): Promise<void> {
  await installUpdateAfterServerStops({
    stopServer: stopServerOnce,
    quitAndInstall: () => autoUpdater.quitAndInstall(),
    setInstalling: (installing) => (installingUpdate = installing),
    onFailure: handleShutdownFailure,
  });
}

function createWindow(): void {
  const displays = screen.getAllDisplays();
  const externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0;
  });

  const position =
    externalDisplay && is.dev
      ? {
          x: externalDisplay.bounds.x + 50,
          y: externalDisplay.bounds.y + 50,
        }
      : {};

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: true, // Show the window immediately on startup
    icon: getIconPath(),
    autoHideMenuBar: true,
    ...position,
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: is.dev,
      additionalArguments: [`--app-version=${app.getVersion()}`],
    },
  });

  // Integration tests drive the window over CDP; an open DevTools window hides it from Playwright.
  if (is.dev && !isDesktopIntegrationTest) {
    mainWindow.webContents.openDevTools();
  }

  if (isE2ESmokeTest) {
    mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
      console.info(`[E2E] renderer-console level=${level} ${sourceId}:${line} ${message}`);
    });
    mainWindow.webContents.on("did-fail-load", (_event, code, description, url, isMainFrame) => {
      console.error(
        `[E2E] renderer-load-error code=${code} mainFrame=${isMainFrame} url=${url} ${description}`,
      );
    });
    mainWindow.webContents.on("render-process-gone", (_event, details) => {
      console.error(`[E2E] renderer-process-gone ${JSON.stringify(details)}`);
    });
  }

  mainWindow.webContents.on("did-finish-load", () => {
    if (pendingUrl) {
      mainWindow?.webContents.send("protocol-url", pendingUrl);
      pendingUrl = null;
    }

    if (isE2ESmokeTest) {
      const exitAfterStoppingServer = (exitCode: number) => {
        void stopServerOnce()
          .then(() => app.exit(exitCode))
          .catch((error) => {
            console.error("[E2E] CLI server shutdown failed:", error);
            app.exit(1);
          });
      };

      void mainWindow.webContents
        .executeJavaScript(
          e2eHistoryPath
            ? `(async () => {
              const route = ${JSON.stringify(e2eHistoryPath)};
              const expectedRuns = ${e2eExpectedRunCount};
              if (!route || !Number.isInteger(expectedRuns) || expectedRuns < 1) {
                throw new Error("Invalid Desktop history acceptance parameters");
              }
              const waitFor = async (read, label) => {
                const deadline = Date.now() + 45_000;
                while (Date.now() < deadline) {
                  const value = read();
                  if (value) return value;
                  await new Promise((resolve) => setTimeout(resolve, 200));
                }
                const pageState = {
                  path: window.location.pathname,
                  title: document.title,
                  body: document.body?.innerText.slice(0, 1_200) || "<empty body>",
                  scripts: Array.from(document.scripts, (script) => script.src),
                  bundles: performance
                    .getEntriesByType("resource")
                    .map((entry) => entry.name)
                    .filter((name) => name.includes("/assets/")),
                };
                throw new Error(
                  "Timed out waiting for Desktop " + label + " (" + JSON.stringify(pageState) + ")",
                );
              };
              await waitFor(() => document.querySelector("#app > .app"), "UI mount");
              const runPath = new URL(route, window.location.href).pathname;
              const runPathSegments = runPath.split("/");
              const isRunsListPath =
                runPathSegments.length === 5 &&
                runPathSegments[1] === "workflows" &&
                runPathSegments[4] === "runs";
              const hasExpectedRunPath =
                runPathSegments.length === 6 &&
                runPathSegments[1] === "workflows" &&
                runPathSegments[4] === "runs";
              const runListPath =
                isRunsListPath || hasExpectedRunPath
                  ? runPathSegments.slice(0, 5).join("/")
                  : null;
              if (!runListPath) throw new Error("The acceptance route must identify workflow runs");
              const workflowPath = runPathSegments.slice(0, 4).join("/");
              const findLink = (path) =>
                Array.from(document.querySelectorAll("a[href]")).find(
                  (link) => link.getAttribute("href") === path,
                );
              // The dashboard shows workflow cards only before any run exists; afterwards it links
              // to recent runs. Either lands inside the workflow layout, whose tabs link to Runs.
              const workflowLink = await waitFor(
                () =>
                  findLink(workflowPath) ||
                  Array.from(document.querySelectorAll("a[href]")).find((link) =>
                    link.getAttribute("href")?.startsWith(workflowPath + "/"),
                  ),
                "workflow link",
              );
              workflowLink.click();
              await waitFor(
                () =>
                  window.location.pathname === workflowPath ||
                  window.location.pathname.startsWith(workflowPath + "/"),
                "workflow page",
              );
              const runsLink = await waitFor(() => findLink(runListPath), "workflow runs link");
              runsLink.click();
              await waitFor(() => window.location.pathname === runListPath, "workflow runs page");
              const rows = await waitFor(() => {
                const error = document.querySelector('[role="alert"]');
                if (error) throw new Error(error.textContent || "Could not load workflow runs");
                const list = document.querySelector('[aria-label="Workflow runs"]');
                const items = list?.querySelectorAll('[role="listitem"]');
                return items?.length === expectedRuns ? items : null;
              }, "workflow history");
              const expectedRunId = hasExpectedRunPath ? runPathSegments[5] : null;
              const expectedShortId = expectedRunId && expectedRunId.length > 12
                ? expectedRunId.slice(0, 8)
                : expectedRunId;
              const newestRow = rows[0];
              const expectedRow = expectedShortId
                ? Array.from(rows).find((row) => row.textContent?.includes("#" + expectedShortId))
                : newestRow;
              if (!expectedRow) throw new Error("The expected run is missing from Desktop history");
              const selectedShortId = expectedRow.querySelector(".run-id")?.textContent?.trim().replace(/^#/, "");
              if (!selectedShortId) throw new Error("The expected run has no visible run ID");
              // The row's click handler lives on its inner button.
              (expectedRow.querySelector("button.run-row") || expectedRow).click();
              await waitFor(() => {
                if (hasExpectedRunPath) return window.location.pathname === runPath;
                const selectedPath = window.location.pathname.split("/");
                return selectedPath.length === 6 &&
                  selectedPath.slice(0, 5).join("/") === runListPath &&
                  selectedPath[5].startsWith(selectedShortId);
              }, "selected run");
              await waitFor(
                () => document.querySelector(".run-page .run-header .title-line"),
                "run details",
              );
              // The run status is the header Tag; its label is the status with dashes as spaces.
              const status = document
                .querySelector(".run-page .run-header .title-line .p-tag-label")
                ?.textContent?.trim();
              if (status !== "completed") {
                throw new Error("Unexpected run status: " + (status || "missing"));
              }
              const artifactsTab = Array.from(document.querySelectorAll(".detail-tabs button"))
                .find((button) => button.textContent?.includes("Artifacts"));
              if (!artifactsTab) throw new Error("The Desktop Artifacts tab is missing");
              // The Artifacts tab shows the run's artifact count in its trailing span.
              const artifactCount = Number(artifactsTab.querySelector("span")?.textContent?.trim() || 0);
              if (artifactCount < 1) throw new Error("The completed Desktop run has no artifacts");
              artifactsTab.click();
              const artifactRows = await waitFor(
                () => {
                  const rows = document.querySelectorAll(".artifact-list .artifact-row");
                  return rows.length ? rows : null;
                },
                "artifact list",
              );
              if (artifactRows.length !== artifactCount) {
                throw new Error(
                  "Expected " + artifactCount + " Desktop artifacts, found " + artifactRows.length,
                );
              }
              const openButton = document.querySelector('.artifact-row button[aria-label^="Open "]');
              const artifactPath = openButton?.getAttribute("data-artifact-path");
              if (!artifactPath) {
                throw new Error("No local artifact can be opened from Desktop");
              }
              await window.pipelab.showItemInFolder(artifactPath);
              return "history-verified";
            })()`
            : "document.readyState === 'complete' && document.body && document.body.innerHTML.trim().length > 0",
        )
        .then((result) => {
          if (result !== true && result !== "history-verified") {
            throw new Error("Renderer loaded an empty document");
          }
          console.info(
            e2eHistoryPath ? "[E2E] workflow-history-verified" : "[E2E] renderer-loaded",
          );
          exitAfterStoppingServer(0);
        })
        .catch((error) => {
          console.error("[E2E] renderer-load-failed:", error);
          exitAfterStoppingServer(1);
        });
    }
  });

  mainWindow.on("close", (event) => {
    if (installingUpdate) return;
    event.preventDefault();
    void stopServerOnce()
      .then(() => app.exit(0))
      .catch(handleShutdownFailure);
  });

  const openExternally = (rawUrl: string) => {
    if (isExternalHttpUrl(rawUrl)) {
      void shell.openExternal(rawUrl);
    } else {
      console.warn("Blocked external URL", rawUrl);
    }
  };

  mainWindow.webContents.setWindowOpenHandler((details) => {
    openExternally(details.url);
    return { action: "deny" };
  });

  // The renderer never leaves the app's own origin; anything else opens in the system browser.
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isTrustedRendererUrl(url, getTrustedUiOrigins())) return;
    event.preventDefault();
    openExternally(url);
  });
}

async function restoreWindowAfterFailedShutdown(): Promise<void> {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  await startServer();
  await loadServerUi((url) => mainWindow?.loadURL(url) ?? Promise.resolve());
}

const protocolName = getProtocolName(app.getVersion());

if (is.dev && process.platform === "win32") {
  app.setAsDefaultProtocolClient(protocolName, process.execPath, [resolve(process.argv[1])]);
} else {
  app.setAsDefaultProtocolClient(protocolName);
}

function getUpdateChannel(): UpdateChannel {
  return app.getVersion().includes("beta") ? "beta" : "stable";
}

async function findUpdateForChannel(channel: unknown) {
  if (channel !== "stable" && channel !== "beta") throw new Error("Unknown update channel");
  if (!app.isPackaged || channel === getUpdateChannel()) return null;

  // The other channel is a separate application, with its own installer and data directory.
  const release = await fetchLatestDesktopRelease({ channel, throwOnError: true });
  const update = resolveAvailableUpdate(release, app.getVersion(), process.platform);
  return release && update ? { version: update.version, downloadUrl: release.html_url } : null;
}

let updater: ReturnType<typeof createUpdater> | undefined;
/** Set while the app is broken: update results go to a dialog because there is no UI. */
let failureUpdateReport: ((state: UpdateState) => void) | undefined;

function startUpdater(): void {
  if (!app.isPackaged || updater) return;

  const currentVersion = app.getVersion();
  // Linux can only update itself when running as an AppImage.
  const canSelfUpdate = process.platform !== "linux" || Boolean(process.env.APPIMAGE);
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.allowDowngrade = false;

  updater = createUpdater({
    currentVersion,
    platform: process.platform,
    native: canSelfUpdate ? autoUpdater : undefined,
    // macOS publishes one feed per architecture (see electron-builder.config.mjs).
    channel: process.platform === "darwin" ? `latest-${process.arch}` : undefined,
    fetchRelease: () =>
      fetchLatestDesktopRelease({
        channel: getUpdateChannel(),
        currentVersion,
        throwOnError: true,
      }),
    feedUrl: (release) => getDesktopReleaseFeedUrl(release, process.env.APP_UPDATE_URL),
    send: (state) => {
      if (failureUpdateReport) failureUpdateReport(state);
      else {
        mainWindow?.webContents.send("update:set-status", {
          data: state,
          requestId: "shell-update",
        });
      }
    },
    onDownloaded: (update) => {
      void dialog
        .showMessageBox({
          type: "info",
          buttons: ["Restart", "Later"],
          defaultId: 0,
          title: "Update ready",
          message: `Pipelab ${update.version} is ready to install.`,
          detail: "Restart the application to apply the update.",
        })
        .then(({ response }) => {
          if (response === 0) void installDownloadedUpdate();
        });
    },
    log: (message, ...args) => console.warn(`[Update] ${message}`, ...args),
  });

  // Never delay startup: check shortly after launch, then every few hours.
  setTimeout(() => void updater?.check(), 10_000);
  setInterval(() => void updater?.check(), 6 * 60 * 60 * 1000).unref();
}

/**
 * Pipelab cannot run (the server will not start or keeps crashing). Report why and, since a
 * newer version may be the fix, let the user update from here instead of just closing.
 */
async function reportFatalError(title: string, message: string): Promise<void> {
  console.error(`[Main] ${title}: ${message}`);
  const canUpdate = Boolean(updater);
  const buttons = canUpdate ? ["Check for updates", "Quit"] : ["Quit"];
  const { response } = await dialog.showMessageBox({
    type: "error",
    title,
    message,
    buttons,
    defaultId: 0,
    cancelId: buttons.length - 1,
  });
  if (!updater || response !== 0) {
    app.quit();
    return;
  }

  // The update dialog ("Restart") is shown by the updater once a download completes.
  failureUpdateReport = (state) => {
    if (
      state.status === "update-downloaded" ||
      state.status === "update-downloading" ||
      state.status === "checking-for-update"
    ) {
      return;
    }
    failureUpdateReport = undefined;
    if (state.status === "update-available" && state.downloadUrl) {
      void shell.openExternal(state.downloadUrl);
      app.quit();
      return;
    }
    void dialog
      .showMessageBox({
        type: "info",
        title,
        message:
          state.status === "update-not-available"
            ? "Pipelab is already up to date."
            : "Pipelab could not check for updates. Check your internet connection.",
        detail: "Restart Pipelab. If it keeps failing, report the '[Server]' lines it prints.",
      })
      .then(() => app.quit());
  };
  await updater.check();
}

app.whenReady().then(async () => {
  if (cliPassthroughArgs) return;

  // Check if launched via protocol URL on startup
  const startupArgs = is.dev ? process.argv.slice(2) : process.argv.slice(1);
  try {
    const config = {
      options: {
        "process-start-args": { type: "string" as const },
      },
      strict: false,
    };
    const { values, positionals } = parseArgs({
      ...config,
      args: startupArgs,
    });
    const url = findProtocolUrl(process.argv, values, positionals);
    if (url) {
      handleProtocolUrl(url);
    }
  } catch (err) {
    console.error("[Main] Failed to parse startup protocol URL:", err);
  }

  const appBundleId = getAppBundleId(app.getVersion());
  electronApp.setAppUserModelId(appBundleId);
  const releaseTag = app.getVersion().includes("beta") ? "beta" : "latest";
  const workflowContext = new PipelabContext({ userDataPath: customUserDataPath, releaseTag });
  const workflowPersistence = new ReleasePersistence(workflowContext);
  const workflowRegistry = buildCoreReleaseRegistry();
  registerIpcHandlers(
    relaunchAfterServerStops,
    installDownloadedUpdate,
    getUpdateChannel,
    findUpdateForChannel,
    (workflowId) =>
      readWorkflowEnvironmentForWorkflow(
        workflowId,
        (id) => workflowPersistence.load(id),
        (config) =>
          getReleaseWorkflowEnvironmentVariableNames(config, workflowRegistry, {
            platform: process.platform,
            architecture: process.arch,
          }),
      ),
    getTrustedUiOrigins,
    (kind) => (kind === "cache" ? workflowContext.getCachePath() : workflowContext.getTempPath()),
  );
  createWindow();
  // Updates must work even when the server cannot start, so this does not wait for it.
  startUpdater();
  onServerFailed((message) => reportFatalError("Server Error", message));

  // Start the background server (this might include downloading the CLI on first run)
  try {
    console.info("[Main] Starting standalone server...");
    await startServer();
    console.info("[Main] Standalone server is ready");

    // Do not load any renderer until the in-process server is listening.
    console.info(`[Main] Loading ${is.dev ? "development" : "production"} UI`);
    if (isDesktopIntegrationTest) {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 5000));
    }
    await loadServerUi((url) => mainWindow?.loadURL(url) ?? Promise.resolve());

    // When the server crashes later and is restarted, point the window at it again.
    onServerRestarted((port) => {
      mainWindow?.loadURL(getUiUrl(port)).catch((error: unknown) => {
        console.error("[Main] Could not reload the UI after a server restart:", error);
      });
    });
  } catch (error) {
    console.error("Failed to start standalone server:", error);
    await reportFatalError(
      "Startup Error",
      "Pipelab could not start its background server, which it needs to run.\n\n" +
        `Cause: ${error instanceof Error ? error.message : String(error)}\n\n` +
        "Restart Pipelab, or update it: a newer version may fix this. If it keeps failing, " +
        "start it from a terminal and report the '[Server]' lines it prints.",
    );
    return;
  }

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") {
    void stopServerOnce()
      .then(() => app.quit())
      .catch(handleShutdownFailure);
  }
});

app.on("before-quit", (event) => {
  if (installingUpdate) return;
  event.preventDefault();
  void stopServerOnce()
    .then(() => app.exit(0))
    .catch(handleShutdownFailure);
});
