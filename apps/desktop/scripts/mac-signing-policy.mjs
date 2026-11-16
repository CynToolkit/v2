#!/usr/bin/env node

import { appendFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const macSigningSecretNames = [
  "APPLE_ID",
  "APPLE_ID_PASSWORD",
  "APPLE_TEAM_ID",
  "CERTIFICATE_OSX_APPLICATION",
  "CERTIFICATE_OSX_APPLICATION_PASSWORD",
];

export function resolveMacSigningMode(env) {
  const missing = macSigningSecretNames.filter((name) => !env[name]?.trim());
  const configured = macSigningSecretNames.length - missing.length;

  if (configured === macSigningSecretNames.length) {
    return { mode: "developer-id", missing: [] };
  }
  if (configured === 0 && env.PRERELEASE === "true") {
    return { mode: "adhoc", missing: [] };
  }
  return { mode: null, missing };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = resolveMacSigningMode(process.env);
  if (!result.mode) {
    console.error(`::error::Missing required Apple release secrets: ${result.missing.join(", ")}`);
    process.exitCode = 1;
  } else {
    if (result.mode === "adhoc") {
      console.error(
        "::notice::No Apple signing secrets configured; building an ad-hoc-signed macOS prerelease.",
      );
    }
    const output = process.env.GITHUB_OUTPUT;
    if (output) {
      await appendFile(output, `mode=${result.mode}\n`);
    } else {
      console.log(`mode=${result.mode}`);
    }
  }
}
