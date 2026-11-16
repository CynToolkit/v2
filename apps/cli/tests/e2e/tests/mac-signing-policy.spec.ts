import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const secretNames = [
  "APPLE_ID",
  "APPLE_ID_PASSWORD",
  "APPLE_TEAM_ID",
  "CERTIFICATE_OSX_APPLICATION",
  "CERTIFICATE_OSX_APPLICATION_PASSWORD",
];
const helperPath = path.resolve(process.cwd(), "../desktop/scripts/mac-signing-policy.mjs");
const fixtures: string[] = [];

afterEach(async () => {
  await Promise.all(
    fixtures.splice(0).map((fixture) => rm(fixture, { recursive: true, force: true })),
  );
});

async function runPolicy(prerelease: boolean, presentSecrets: string[]) {
  const fixture = await mkdtemp(path.join(tmpdir(), "pipelab-mac-signing-"));
  fixtures.push(fixture);
  const outputPath = path.join(fixture, "github-output");
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PRERELEASE: String(prerelease),
    GITHUB_OUTPUT: outputPath,
  };
  for (const name of secretNames) delete env[name];
  for (const name of presentSecrets) env[name] = `test-value-${name}`;

  const result = spawnSync(process.execPath, [helperPath], {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
  });
  const output = await readFile(outputPath, "utf8").catch(() => "");
  return { result, output };
}

describe("macOS release signing policy", () => {
  it("requires and uses Developer ID signing for stable releases", async () => {
    const { result, output } = await runPolicy(false, secretNames);

    expect(result.status).toBe(0);
    expect(output).toBe("mode=developer-id\n");
    expect(result.stdout + result.stderr).not.toContain("test-value-");
  });

  it("allows an ad-hoc-signed prerelease when no Apple secrets are configured", async () => {
    const { result, output } = await runPolicy(true, []);

    expect(result.status).toBe(0);
    expect(output).toBe("mode=adhoc\n");
    expect(result.stderr).toContain("ad-hoc-signed macOS prerelease");
  });

  it("fails a partially configured prerelease and names only missing secrets", async () => {
    const present = ["APPLE_ID", "APPLE_ID_PASSWORD"];
    const { result, output } = await runPolicy(true, present);

    expect(result.status).toBe(1);
    expect(output).toBe("");
    for (const missing of secretNames.filter((name) => !present.includes(name))) {
      expect(result.stderr).toContain(missing);
    }
    expect(result.stderr).not.toContain("test-value-");
  });

  it("requires all Apple secrets for stable releases", async () => {
    const { result, output } = await runPolicy(false, []);

    expect(result.status).toBe(1);
    expect(output).toBe("");
    for (const name of secretNames) expect(result.stderr).toContain(name);
  });
});
