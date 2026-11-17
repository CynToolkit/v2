import { afterEach, expect, test, vi } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fetchPackage, type ProviderHostContext } from "@pipelab/plugin-core";
import { loadConstructPlaywright } from "./playwright-runtime";

vi.mock("playwright", () => {
  throw new Error("Playwright must not be imported at startup");
});
vi.mock("@pipelab/plugin-core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@pipelab/plugin-core")>()),
  fetchPackage: vi.fn(),
}));

afterEach(() => vi.clearAllMocks());
import {
  chromiumProfiles,
  detectConstructAuthStatusFromResponse,
  listChromiumBrowserProfiles,
  inspectChromiumProfile,
} from "./browser-profiles";

test("discovers a nested Chromium profile as its own exact selection", async () => {
  const root = await mkdtemp(join(tmpdir(), "construct-nested-profile-"));
  const userData = join(root, "PipelabConstruct");
  const profile = join(userData, "Default");
  try {
    await mkdir(profile, { recursive: true });
    await writeFile(
      join(root, "Local State"),
      JSON.stringify({
        profile: { info_cache: { PipelabConstruct: { name: "PipelabConstruct" } } },
      }),
    );
    await writeFile(
      join(userData, "Local State"),
      JSON.stringify({ profile: { info_cache: { Default: { name: "Your Chromium" } } } }),
    );
    await writeFile(join(userData, "Preferences"), "outer metadata");
    await writeFile(join(profile, "Preferences"), "selected profile metadata");

    expect(await chromiumProfiles(root)).toEqual([
      { path: join("PipelabConstruct", "Default"), name: "Your Chromium" },
    ]);
    expect(fetchPackage).not.toHaveBeenCalled();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("lists selectable Chromium profiles from local metadata only", async () => {
  const root = await mkdtemp(join(tmpdir(), "construct-profile-options-"));
  const profile = join(root, "Default");
  try {
    await mkdir(profile, { recursive: true });
    await writeFile(
      join(root, "Local State"),
      JSON.stringify({ profile: { info_cache: { Default: { name: "Construct profile" } } } }),
    );
    await writeFile(join(profile, "Preferences"), "profile metadata");

    expect(fetchPackage).not.toHaveBeenCalled();
    await expect(listChromiumBrowserProfiles([["Chromium", root]])).resolves.toEqual([
      { browser: "Chromium", profileName: "Construct profile", path: profile },
    ]);
    expect(fetchPackage).not.toHaveBeenCalled();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test.each([
  [
    "https://account.construct.net/login.json",
    200,
    { request: { status: "ok" }, response: { userID: 123, token: "session" } },
    "authenticated",
  ],
  [
    "https://account.construct.net/account.json",
    200,
    { request: { status: "ok" }, response: { userID: 123 } },
    "authenticated",
  ],
  [
    "https://account.construct.net/login.json",
    200,
    { request: { status: "error" } },
    "not-authenticated",
  ],
  ["https://account.construct.net/login.json", 401, null, "not-authenticated"],
  ["https://editor.construct.net/", 200, { request: { status: "ok" } }, "unknown"],
  ["not a URL", 200, null, "unknown"],
] as const)(
  "reports Construct auth status from login response %s",
  (url, status, payload, expected) => {
    expect(detectConstructAuthStatusFromResponse(url, status, payload)).toBe(expected);
  },
);

test("loads the managed Playwright package only for browser operations", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "construct-lazy-playwright-"));
  t.onTestFinished(() => rm(root, { recursive: true, force: true }));
  const previousBrowsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
  t.onTestFinished(() => {
    if (previousBrowsersPath === undefined) delete process.env.PLAYWRIGHT_BROWSERS_PATH;
    else process.env.PLAYWRIGHT_BROWSERS_PATH = previousBrowsersPath;
  });
  const context: ProviderHostContext = {
    releaseTag: "latest",
    getPackagesPath: (...parts) => join(root, "packages", ...parts),
    getThirdPartyPath: (...parts) => join(root, "thirdparty", ...parts),
    getTempPath: (...parts) => join(root, "temp", ...parts),
    createTempFolder: async () => root,
    getCachePath: () => root,
    getPnpmPath: () => root,
    getNodePath: () => process.execPath,
    getConnectionsPath: () => root,
    ensureNodeJS: async () => process.execPath,
    ensurePNPM: async () => "pnpm",
    resolveBundledAsset: async () => root,
  };
  await expect(inspectChromiumProfile(join(root, "missing"), context)).resolves.toMatchObject({
    authStatus: "unknown",
    usable: false,
  });
  expect(fetchPackage).not.toHaveBeenCalled();

  const packageDir = join(root, "cached-runtime");
  await mkdir(packageDir);
  await writeFile(join(packageDir, "package.json"), '{"type":"commonjs"}');
  await writeFile(
    join(packageDir, "index.js"),
    'exports.chromium = { executablePath: () => "cached-chromium" };',
  );
  vi.mocked(fetchPackage).mockResolvedValue({ packageDir, resolvedVersion: "1.62.1" });
  const { playwright } = await loadConstructPlaywright(context);
  expect(playwright.chromium.executablePath()).toBe("cached-chromium");
  expect(fetchPackage).toHaveBeenCalledWith("playwright-core", "1.62.1", {
    installDeps: true,
    context,
  });

  // A download failure affects the requested inspection, not application startup.
  vi.mocked(fetchPackage).mockRejectedValue(new Error("offline"));
  const profile = join(root, "profile");
  await mkdir(profile);
  await writeFile(join(profile, "Preferences"), "{}");
  await expect(inspectChromiumProfile(profile, context)).resolves.toMatchObject({
    authStatus: "unknown",
    usable: false,
  });
  expect(fetchPackage).toHaveBeenCalledTimes(2);
});
