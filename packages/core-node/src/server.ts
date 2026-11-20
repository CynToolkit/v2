import { PipelabContext, isDev, registerAllHandlers, webSocketServer } from "./index";
import { resolveBundledUiFolder } from "./bundled-cli";
import { getUiDevServerMissingWarning, uiDevPort } from "@pipelab/constants";
import { existsSync } from "node:fs";
import http from "http";
import handler from "serve-handler";
import {
  DEFAULT_ALLOWED_ORIGINS,
  DEFAULT_SERVER_HOST,
  type ServerSecurityOptions,
} from "./server-security";
import { markDesktopHosted } from "./desktop-host";

export interface ServeOptions {
  port: string | number;
  userData?: string;
  nodePath?: string;
  pnpmPath?: string;
  host?: string;
  authToken?: string;
  allowedOrigin?: string;
  /** Set when the Desktop app runs the server inside its own process. */
  desktopHosted?: boolean;
}

let startupDone = false;

export const sendStartupProgress = (message: string) => {
  // Late progress (e.g. a run installing PNPM) must not replace the sticky "done" event
  // that new clients replay, or they would sit on the splash screen forever.
  if (startupDone) return;
  webSocketServer.broadcast("startup:progress", {
    type: "progress",
    data: { message },
  });
};

export const sendStartupReady = () => {
  startupDone = true;
  console.log(`[Startup Progress] Ready!`);
  webSocketServer.broadcast("startup:progress", {
    type: "done",
  });
};

export async function serveCommand(options: ServeOptions, version: string, cliDirname: string) {
  if (!options.userData) throw new Error("userDataPath is required for serveCommand");
  if (options.desktopHosted) markDesktopHosted();
  const releaseTag = version.includes("beta") ? "beta" : "latest";
  const context = new PipelabContext({
    userDataPath: options.userData,
    releaseTag,
  });
  const security: ServerSecurityOptions & { host: string } = {
    host: options.host || DEFAULT_SERVER_HOST,
    authToken: options.authToken || process.env.PIPELAB_AUTH_TOKEN,
    allowUnauthenticated: isDev,
    allowedOrigins: [
      ...DEFAULT_ALLOWED_ORIGINS,
      ...(options.allowedOrigin ? [options.allowedOrigin] : []),
    ],
  };
  let rawAssetFolder: string | undefined;
  if (!isDev) {
    rawAssetFolder = resolveBundledUiFolder(cliDirname);
  }

  const server = http.createServer(async (request, response) => {
    if (isDev) {
      const requestHost = request.headers.host?.split(":")[0] || "localhost";
      response.writeHead(302, {
        Location: `http://${requestHost}:${uiDevPort}${request.url || "/"}`,
      });
      response.end();
      return;
    }

    if (!rawAssetFolder || !existsSync(rawAssetFolder)) {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.end(
        `Error: UI directory not found at ${rawAssetFolder}.\n` +
          "Please run 'pnpm build' in apps/ui to generate the distribution.",
      );
      return;
    }

    return handler(request, response, {
      public: rawAssetFolder,
      rewrites: [{ source: "/**", destination: "/index.html" }],
    });
  });

  // Start the server EARLY so the UI can connect and receive progress updates
  await webSocketServer.start(Number(options.port), server, security);

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Pipelab server started without a TCP address.");
  }
  const boundPort = address.port;
  console.log(`Pipelab server listening on port ${boundPort}`);

  if (isDev) {
    console.info(getUiDevServerMissingWarning());
    console.log(`UI available at http://localhost:${uiDevPort}`);
  } else {
    console.log(`UI available at http://127.0.0.1:${boundPort}`);
  }

  await registerAllHandlers({
    version,
    context,
  });

  sendStartupReady();

  return { server, port: boundPort };
}
