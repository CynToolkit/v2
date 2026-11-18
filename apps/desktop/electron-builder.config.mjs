// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "./package.json" with { type: "json" };

const root = path.dirname(fileURLToPath(import.meta.url));
const { version } = pkg;
const isBeta = version.includes("beta");
const isPullRequest = process.env.GITHUB_EVENT_NAME === "pull_request";
const hasAppleCredentials = Boolean(
  process.env.APPLE_ID && process.env.APPLE_APP_SPECIFIC_PASSWORD && process.env.APPLE_TEAM_ID,
);
const arch = process.env.TARGET_ARCH || process.arch;

// Mirrors getProductName/getAppBundleId from @pipelab/constants, which cannot
// be imported here because Node does not type-strip files under node_modules.
const productName = isBeta ? "PipelabBeta" : "Pipelab";
const appId = isBeta ? "app.pipelab.desktop.beta" : "app.pipelab.desktop";

const macIdentity = isPullRequest
  ? null // unsigned
  : hasAppleCredentials
    ? undefined // auto-discover the Developer ID identity in the keychain
    : version.includes("-")
      ? "-" // ad-hoc signature for unsigned prereleases
      : null;

/** @type {import("electron-builder").Configuration} */
export default {
  appId,
  productName,
  executableName: productName,
  artifactName: "pipelab-desktop-v${version}-${os}-${arch}.${ext}",
  directories: { output: "../out/make", buildResources: path.join(root, "assets/build") },
  // Ship only the built runtime. The main process bundles its dependencies.
  files: [".vite/**", "dist/cli/**", "assets/build/**", "package.json"],
  asar: false,
  npmRebuild: false,
  extraMetadata: { main: ".vite/build/main.js" },
  electronFuses: {
    runAsNode: true,
    enableCookieEncryption: true,
    enableNodeOptionsEnvironmentVariable: true,
    enableNodeCliInspectArguments: false,
    enableEmbeddedAsarIntegrityValidation: false,
    onlyLoadAppFromAsar: false,
  },
  // Feed metadata only: the app resolves the exact release feed at runtime.
  // One feed file per mac architecture, so parallel CI jobs never overwrite each other.
  publish: {
    provider: "generic",
    url: "https://github.com/CynToolkit/v2/releases/latest/download",
    channel: process.platform === "darwin" ? `latest-${arch}` : "latest",
  },
  mac: {
    target: [{ target: "zip" }, ...(isPullRequest ? [] : [{ target: "dmg" }])],
    icon: "icon.icns",
    category: "public.app-category.developer-tools",
    hardenedRuntime: true,
    entitlements: "entitlements.mac.plist",
    entitlementsInherit: "entitlements.mac.plist",
    identity: macIdentity,
    notarize: !isPullRequest && hasAppleCredentials,
    extendInfo: {
      NSAppleEventsUsageDescription: "This app need to run commands through Terminal.",
    },
  },
  win: { target: [{ target: "nsis", arch: ["x64"] }], icon: "icon.ico" },
  nsis: { oneClick: true, perMachine: false },
  linux: { target: ["AppImage", "zip"], icon: "icon.png", category: "Development" },
};
