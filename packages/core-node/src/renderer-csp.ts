import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FALLBACK_CONNECT_SRC = [
  "'self'",
  "https://eu.i.posthog.com",
  // The local agent port is selected at runtime.
  "ws://localhost:*",
  "ws://127.0.0.1:*",
].join(" ");

const readFile = (path: string) => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
};

/**
 * The Editor build already records its reviewed network origins (PostHog,
 * Supabase, Cloud Worker) in the `_headers` policy it emits; reuse them so the
 * enforced policy cannot drift from the build's own configuration.
 */
const connectSrcFromBuild = (headers: string | undefined) => {
  const policy = headers?.match(/Content-Security-Policy(?:-Report-Only)?:\s*(.+)/)?.[1];
  const directive = policy
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("connect-src "));
  return directive ? directive.slice("connect-src ".length) : FALLBACK_CONNECT_SRC;
};

/** CSP hash sources for the page's inline (non-external) scripts. */
const inlineScriptHashes = (indexHtml: string) =>
  [...indexHtml.matchAll(/<script(?<attributes>[^>]*)>(?<body>[\s\S]*?)<\/script>/gi)]
    .filter((match) => !/\bsrc\s*=/i.test(match.groups?.attributes ?? ""))
    .map(
      (match) =>
        `'sha256-${createHash("sha256")
          .update(match.groups?.body ?? "")
          .digest("base64")}'`,
    );

/**
 * Enforced Content-Security-Policy for the bundled Editor served by the local
 * server. Scripts are limited to same-origin files plus the hashed inline boot
 * script; styles allow inline because Vue and PrimeVue inject style elements
 * and attributes at runtime. JavaScript eval and WebAssembly
 * compilation stay disallowed.
 */
export const buildRendererCsp = (uiFolder: string) => {
  const indexHtml = readFile(join(uiFolder, "index.html")) ?? "";
  const connectSrc = connectSrcFromBuild(readFile(join(uiFolder, "_headers")));
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    ["script-src 'self'", ...inlineScriptHashes(indexHtml)].join(" "),
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    `connect-src ${connectSrc}`,
    "frame-src 'none'",
    "worker-src 'self' blob:",
  ].join("; ");
};

export const rendererSecurityHeaders = (uiFolder: string) => [
  {
    source: "**",
    headers: [
      { key: "Content-Security-Policy", value: buildRendererCsp(uiFolder) },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "no-referrer" },
    ],
  },
];
