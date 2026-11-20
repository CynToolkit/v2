import { spawn } from "node:child_process";
import { app } from "electron";
import { is } from "@electron-toolkit/utils";
import { join } from "node:path";

/**
 * Arguments after `Pipelab cli`, or undefined when this launch is not a CLI passthrough.
 * Switches before the command (Chromium flags such as `--no-sandbox`) are skipped.
 */
export const getCliPassthroughArgs = (argv: string[], dev: boolean): string[] | undefined => {
  const args = argv.slice(dev ? 2 : 1);
  const commandIndex = args.findIndex((arg) => !arg.startsWith("-"));
  return args[commandIndex] === "cli" ? args.slice(commandIndex + 1) : undefined;
};

/**
 * Run the bundled CLI program (`Pipelab cli workflow run <id>`, `Pipelab cli --help`, ...)
 * and exit with its exit code. No window is created and no Desktop server is started.
 */
export const runCliPassthrough = (args: string[]): void => {
  app.dock?.hide();
  const child = spawn(
    process.execPath,
    [join(app.getAppPath(), ".vite", "build", "cli-entry.js"), ...args],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        NODE_ENV: is.dev ? "development" : "production",
        CLI_VERSION: app.getVersion(),
      },
    },
  );
  for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => child.kill(signal));
  child.once("error", (error) => {
    console.error("Failed to start the Pipelab CLI:", error);
    app.exit(1);
  });
  child.once("exit", (code, signal) => app.exit(code ?? (signal ? 1 : 0)));
};
