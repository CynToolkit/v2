import { describe, test, expect, beforeEach, afterEach, vi, type MockInstance } from "vitest";
import {
  fetchPackageReleases,
  fetchLatestPackageRelease,
  fetchLatestDesktopRelease,
  getDesktopReleaseFeedUrl,
} from "./github";

interface FakeResponseInit {
  ok?: boolean;
  status?: number;
  statusText?: string;
  json?: () => Promise<unknown>;
}

/** A real `Response` carrying the status a test sets, with `json` replaced by the test's body. */
const fakeResponse = ({
  ok = true,
  status = ok ? 200 : 500,
  statusText,
  json,
}: FakeResponseInit) => {
  const response = new Response(null, { status, statusText });
  return json ? Object.assign(response, { json }) : response;
};

describe("GitHub Release Updates API", () => {
  let fetchSpy: MockInstance<typeof fetch>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    // Clean up environment variables
    delete process.env.PIPELAB_OVERRIDE_RELEASE;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("fetchPackageReleases - returns empty array when git matching-refs fails", async () => {
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: false,
        status: 404,
        statusText: "Not Found",
      }),
    );

    const releases = await fetchPackageReleases("@pipelab/app");
    expect(releases).toEqual([]);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "api.github.com/repos/CynToolkit/v2/git/matching-refs/tags/%40pipelab%2Fapp",
      ),
      expect.any(Object),
    );
  });

  test("fetchPackageReleases - returns empty array when no tags match package", async () => {
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        json: async () => [],
      }),
    );

    const releases = await fetchPackageReleases("@pipelab/app");
    expect(releases).toEqual([]);
  });

  test("fetchPackageReleases - correctly filters prereleases when allowPrerelease is false", async () => {
    // 1. mock matching refs
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        json: async () => [
          { ref: "refs/tags/@pipelab/app@1.0.0-beta.1" },
          { ref: "refs/tags/@pipelab/app@1.0.0" },
        ],
      }),
    );

    // 2. mock tag lookup for 1.0.0 (since 1.0.0-beta.1 is filtered out)
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: "@pipelab/app@1.0.0",
          prerelease: false,
          published_at: "2026-06-04T00:00:00Z",
          html_url: "https://github.com/CynToolkit/v2/releases/tag/%40pipelab%2Fapp%401.0.0",
          assets: [],
        }),
      }),
    );

    const releases = await fetchPackageReleases("@pipelab/app", { allowPrerelease: false });
    expect(releases).toHaveLength(1);
    expect(releases[0].tag_name).toBe("@pipelab/app@1.0.0");
  });

  test("fetchPackageReleases - includes prereleases when allowPrerelease is true", async () => {
    // 1. mock matching refs
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        json: async () => [
          { ref: "refs/tags/@pipelab/app@1.0.0-beta.1" },
          { ref: "refs/tags/@pipelab/app@1.0.0" },
        ],
      }),
    );

    // 2. mock tag lookup for 1.0.0 (since sorting puts 1.0.0 first)
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: "@pipelab/app@1.0.0",
          prerelease: false,
          published_at: "2026-06-04T00:00:00Z",
          html_url: "https://github.com/CynToolkit/v2/releases/tag/%40pipelab%2Fapp%401.0.0",
          assets: [],
        }),
      }),
    );

    const releases = await fetchPackageReleases("@pipelab/app", { allowPrerelease: true });
    expect(releases).toHaveLength(1);
    expect(releases[0].tag_name).toBe("@pipelab/app@1.0.0");
  });

  test("fetchPackageReleases - stable updates stay on the installed major and exclude prereleases", async () => {
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        json: async () => [
          { ref: "refs/tags/@pipelab/app@1.9.9" },
          { ref: "refs/tags/@pipelab/app@2.0.0" },
          { ref: "refs/tags/@pipelab/app@2.1.0-beta.1" },
          { ref: "refs/tags/@pipelab/app@2.1.0" },
          { ref: "refs/tags/@pipelab/app@3.0.0" },
        ],
      }),
    );
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: "@pipelab/app@2.1.0",
          prerelease: false,
          published_at: "2026-06-04T00:00:00Z",
          assets: [],
        }),
      }),
    );

    const releases = await fetchPackageReleases("@pipelab/app", {
      currentVersion: "2.0.0",
    });

    expect(releases.map(({ tag_name }) => tag_name)).toEqual(["@pipelab/app@2.1.0"]);
  });

  test("fetchPackageReleases - beta updates stay on the installed major and allow prereleases", async () => {
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        json: async () => [
          { ref: "refs/tags/@pipelab/app@1.9.9-beta.1" },
          { ref: "refs/tags/@pipelab/app@2.1.0-beta.1" },
          { ref: "refs/tags/@pipelab/app@3.0.0-beta.1" },
        ],
      }),
    );
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: "@pipelab/app@2.1.0-beta.1",
          prerelease: true,
          published_at: "2026-06-04T00:00:00Z",
          assets: [],
        }),
      }),
    );

    const releases = await fetchPackageReleases("@pipelab/app", {
      allowPrerelease: true,
      currentVersion: "2.0.0-beta.1",
    });

    expect(releases.map(({ tag_name }) => tag_name)).toEqual(["@pipelab/app@2.1.0-beta.1"]);
  });

  test("fetchPackageReleases - without a channel, prerelease opt-in also allows stable releases", async () => {
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        json: async () => [
          { ref: "refs/tags/@pipelab/app@2.1.0" },
          { ref: "refs/tags/@pipelab/app@3.0.0-beta.1" },
        ],
      }),
    );
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: "@pipelab/app@2.1.0",
          prerelease: false,
          published_at: "2026-06-04T00:00:00Z",
          assets: [],
        }),
      }),
    );

    const releases = await fetchPackageReleases("@pipelab/app", {
      allowPrerelease: true,
      currentVersion: "2.0.0-beta.1",
    });

    expect(releases.map(({ tag_name }) => tag_name)).toEqual(["@pipelab/app@2.1.0"]);
  });

  test.each([
    { channel: "stable" as const, expected: "2.3.0" },
    { channel: "beta" as const, expected: "2.4.0-beta.10" },
  ])(
    "desktop channel $channel selects $expected from mixed tags",
    async ({ channel, expected }) => {
      const versions = ["2.4.0-beta.2", "2.3.0", "2.5.0-rc.1", "2.4.0-beta.10", "2.2.0"];
      fetchSpy.mockResolvedValueOnce(
        fakeResponse({
          json: async () =>
            versions.map((version) => ({
              ref: `refs/tags/@pipelab/app@${version}`,
            })),
        }),
      );
      fetchSpy.mockResolvedValueOnce(
        fakeResponse({ json: async () => ({ tag_name: `@pipelab/app@${expected}` }) }),
      );

      await fetchLatestDesktopRelease({ channel });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy).toHaveBeenLastCalledWith(
        expect.stringContaining(`/releases/tags/%40pipelab%2Fapp%40${expected}`),
        expect.any(Object),
      );
    },
  );

  test("fetchPackageReleases - handles tag that has no release (skips and falls back to older tag)", async () => {
    // 1. mock matching refs
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        json: async () => [
          { ref: "refs/tags/@pipelab/app@1.1.0" },
          { ref: "refs/tags/@pipelab/app@1.0.0" },
        ],
      }),
    );

    // 2. mock tag lookup for 1.1.0 (returns 404 - no release yet, tag exists)
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        status: 404,
        ok: false,
        statusText: "Not Found",
      }),
    );

    // 3. mock tag lookup for 1.0.0 (returns 200 - release exists)
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: "@pipelab/app@1.0.0",
          prerelease: false,
          published_at: "2026-06-04T00:00:00Z",
          assets: [],
        }),
      }),
    );

    const releases = await fetchPackageReleases("@pipelab/app");
    expect(releases).toHaveLength(1);
    expect(releases[0].tag_name).toBe("@pipelab/app@1.0.0");
  });

  test("fetchPackageReleases - handles environment variable PIPELAB_OVERRIDE_RELEASE override", async () => {
    process.env.PIPELAB_OVERRIDE_RELEASE = "1.2.3";

    // Mock direct tag retrieval
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: "@pipelab/app@1.2.3",
          prerelease: false,
          published_at: "2026-06-04T00:00:00Z",
          assets: [],
        }),
      }),
    );

    const releases = await fetchPackageReleases("@pipelab/app");
    expect(releases).toHaveLength(1);
    expect(releases[0].tag_name).toBe("@pipelab/app@1.2.3");
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("releases/tags/%40pipelab%2Fapp%401.2.3"),
      expect.any(Object),
    );
  });

  test("fetchPackageReleases - rejects an override from another major and finds a compatible release", async () => {
    process.env.PIPELAB_OVERRIDE_RELEASE = "3.0.0";
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: "@pipelab/app@3.0.0",
          prerelease: false,
          published_at: "2026-06-04T00:00:00Z",
          assets: [],
        }),
      }),
    );
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        json: async () => [
          { ref: "refs/tags/@pipelab/app@2.4.0" },
          { ref: "refs/tags/@pipelab/app@3.0.0" },
        ],
      }),
    );
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: "@pipelab/app@2.4.0",
          prerelease: false,
          published_at: "2026-06-04T00:00:00Z",
          assets: [],
        }),
      }),
    );

    const releases = await fetchPackageReleases("@pipelab/app", {
      currentVersion: "2.0.0",
    });

    expect(releases.map(({ tag_name }) => tag_name)).toEqual(["@pipelab/app@2.4.0"]);
  });

  test("fetchPackageReleases - stable clients reject prerelease overrides", async () => {
    process.env.PIPELAB_OVERRIDE_RELEASE = "2.1.0-beta.1";
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: "@pipelab/app@2.1.0-beta.1",
          prerelease: true,
          published_at: "2026-06-04T00:00:00Z",
          assets: [],
        }),
      }),
    );
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        json: async () => [{ ref: "refs/tags/@pipelab/app@2.2.0" }],
      }),
    );
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: "@pipelab/app@2.2.0",
          prerelease: false,
          published_at: "2026-06-04T00:00:00Z",
          assets: [],
        }),
      }),
    );

    const releases = await fetchPackageReleases("@pipelab/app", {
      currentVersion: "2.0.0",
    });

    expect(releases.map(({ tag_name }) => tag_name)).toEqual(["@pipelab/app@2.2.0"]);
  });

  test("fetchLatestPackageRelease - selects newest matching release", async () => {
    // Mock matching refs
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        json: async () => [
          { ref: "refs/tags/@pipelab/app@1.0.0" },
          { ref: "refs/tags/@pipelab/app@2.0.0" },
          { ref: "refs/tags/@pipelab/app@1.5.0" },
        ],
      }),
    );

    // Mock release lookup for 2.0.0 (since 2.0.0 is highest version)
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: "@pipelab/app@2.0.0",
          prerelease: false,
          published_at: "2026-06-04T00:00:00Z",
          assets: [],
        }),
      }),
    );

    const latest = await fetchLatestPackageRelease("@pipelab/app");
    expect(latest).not.toBeNull();
    expect(latest?.tag_name).toBe("@pipelab/app@2.0.0");
  });

  test("fetchLatestDesktopRelease - queries the @pipelab/app package specifically", async () => {
    // Mock matching refs
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        json: async () => [{ ref: "refs/tags/@pipelab/app@3.0.0" }],
      }),
    );

    // Mock release lookup
    fetchSpy.mockResolvedValueOnce(
      fakeResponse({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: "@pipelab/app@3.0.0",
          prerelease: false,
          published_at: "2026-06-04T00:00:00Z",
          assets: [],
        }),
      }),
    );

    const latest = await fetchLatestDesktopRelease();
    expect(latest).not.toBeNull();
    expect(latest?.tag_name).toBe("@pipelab/app@3.0.0");
  });

  test("getDesktopReleaseFeedUrl - fails closed without a release but honors an explicit URL", () => {
    expect(getDesktopReleaseFeedUrl(null)).toBeNull();
    expect(getDesktopReleaseFeedUrl(null, "https://updates.example.com/feed")).toBe(
      "https://updates.example.com/feed",
    );
    expect(
      getDesktopReleaseFeedUrl({
        tag_name: "@pipelab/app@2.1.0",
        prerelease: false,
        published_at: "2026-06-04T00:00:00Z",
        html_url: "https://github.com/CynToolkit/v2/releases/tag/@pipelab/app@2.1.0",
        assets: [],
      }),
    ).toBe("https://github.com/CynToolkit/v2/releases/download/@pipelab/app@2.1.0");
  });
});
