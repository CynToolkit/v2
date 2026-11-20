import { afterEach, describe, expect, it, vi } from "vitest";
import { openAsyncUrl } from "./open-async-url";
import { partialDouble } from "@pipelab/shared";

describe("openAsyncUrl", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("opens a user-initiated window before awaiting the destination", async () => {
    let resolveUrl: (url: string) => void = () => {};
    const replace = vi.fn();
    const close = vi.fn();
    const open = vi.fn().mockReturnValue(undefined);
    const popup = partialDouble<Window>({ opener: {}, close, location: { replace } });
    open.mockReturnValue(popup);
    vi.stubGlobal("window", { open });

    const result = openAsyncUrl(() => new Promise((resolve) => (resolveUrl = resolve)));

    expect(open).toHaveBeenCalledWith("about:blank", "_blank");
    expect(popup.opener).toBeNull();
    resolveUrl("https://billing.example/portal");

    await expect(result).resolves.toBe("opened");
    expect(replace).toHaveBeenCalledWith("https://billing.example/portal");
    expect(close).not.toHaveBeenCalled();
  });

  it("opens the resolved destination through Desktop IPC", async () => {
    let resolveUrl: (url: string) => void = () => {};
    const openExternal = vi.fn();
    const open = vi.fn();
    vi.stubGlobal("window", { open, pipelab: { openExternal } });

    const result = openAsyncUrl(() => new Promise((resolve) => (resolveUrl = resolve)));
    expect(openExternal).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();

    resolveUrl("https://billing.example/portal");
    await expect(result).resolves.toBe("opened");
    expect(openExternal).toHaveBeenCalledWith("https://billing.example/portal");
  });

  it("reports a rejected Desktop external-open request", async () => {
    const openExternal = vi.fn().mockResolvedValue(false);
    const open = vi.fn();
    vi.stubGlobal("window", { open, pipelab: { openExternal } });

    await expect(openAsyncUrl(async () => "https://billing.example/portal")).resolves.toBe(
      "failed",
    );
    expect(open).not.toHaveBeenCalled();
  });

  it("rejects non-HTTP destinations", async () => {
    const close = vi.fn();
    const open = vi.fn().mockReturnValue(
      partialDouble<Window>({
        opener: {},
        close,
        location: { replace: vi.fn() },
      }),
    );
    vi.stubGlobal("window", { open });

    await expect(openAsyncUrl(async () => "javascript:alert(1)")).resolves.toBe("failed");
    expect(close).toHaveBeenCalledOnce();
  });

  it("reports blocked popups and closes a blank tab after a failed request", async () => {
    const open = vi.fn().mockReturnValue(null);
    vi.stubGlobal("window", { open });
    await expect(openAsyncUrl(async () => "https://billing.example/portal")).resolves.toBe(
      "blocked",
    );

    const close = vi.fn();
    open.mockReturnValue(
      partialDouble<Window>({
        opener: {},
        close,
        location: { replace: vi.fn() },
      }),
    );
    await expect(openAsyncUrl(async () => undefined)).resolves.toBe("failed");
    expect(close).toHaveBeenCalledOnce();
  });
});
