import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { chromium, type Browser, type Page } from "@playwright/test";

const desktopDir = path.resolve(__dirname, "..", "..");

// `electron-builder --dir` writes the unpacked app under apps/desktop/out/make.
const findPackagedExecutable = (): string => {
  const make = path.join(desktopDir, "out", "make");
  for (const productName of ["PipelabBeta", "Pipelab"]) {
    const candidates = [
      path.join(make, "linux-unpacked", productName),
      path.join(make, "win-unpacked", `${productName}.exe`),
      ...["mac", "mac-arm64", "mac-universal"].map((dir) =>
        path.join(make, dir, `${productName}.app`, "Contents", "MacOS", productName),
      ),
    ];
    const found = candidates.find((candidate) => existsSync(candidate));
    if (found) return found;
  }
  throw new Error(`No packaged app under ${make}. Run \`pnpm package\` first.`);
};

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
  });

const stopProcessTree = (child: ChildProcess) => {
  if (!child.pid) return;
  if (process.platform === "win32") {
    spawn("taskkill.exe", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
  } else {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill();
    }
  }
};

export type PackagedApp = {
  page: Page;
  close: () => Promise<void>;
};

// Launches the packaged executable with a throwaway profile and attaches over CDP.
// The shipped app disables the Node-inspect fuse that Playwright's `_electron.launch` needs,
// so this uses Chromium's remote debugging port, which works on the hardened build.
export const launchPackagedApp = async (): Promise<PackagedApp> => {
  const profileDir = await mkdtemp(path.join(os.tmpdir(), "pipelab-e2e-"));
  const port = await freePort();
  const args = [
    `--user-data-dir=${path.join(profileDir, "user-data")}`,
    `--remote-debugging-port=${port}`,
  ];
  if (process.platform === "linux") args.push("--no-sandbox");

  const child = spawn(findPackagedExecutable(), args, {
    env: {
      ...process.env,
      XDG_CONFIG_HOME: path.join(profileDir, "config"),
      XDG_DATA_HOME: path.join(profileDir, "data"),
      XDG_CACHE_HOME: path.join(profileDir, "cache"),
    },
    stdio: "ignore",
    detached: process.platform !== "win32",
  });
  const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));

  let browser: Browser | undefined;
  const close = async () => {
    await browser?.close().catch((): void => undefined);
    stopProcessTree(child);
    await Promise.race([exited, new Promise<void>((resolve) => setTimeout(resolve, 10_000))]);
    await rm(profileDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }).catch(
      (): void => undefined,
    );
  };

  try {
    const deadline = Date.now() + 60_000;
    for (;;) {
      if (child.exitCode !== null) throw new Error(`App exited early (code ${child.exitCode})`);
      try {
        browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
        break;
      } catch (error) {
        if (Date.now() > deadline) throw error;
        await new Promise<void>((resolve) => setTimeout(resolve, 500));
      }
    }
    const context = browser.contexts()[0] ?? (await browser.newContext());
    const page = context.pages()[0] ?? (await context.waitForEvent("page", { timeout: 60_000 }));
    return { page, close };
  } catch (error) {
    await close();
    throw error;
  }
};
