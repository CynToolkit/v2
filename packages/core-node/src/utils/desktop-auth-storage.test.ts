import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DesktopAuthStorage } from "./desktop-auth-storage";

const keyring = vi.hoisted(() => ({
  getSecret: vi.fn<() => Promise<Uint8Array | undefined>>(),
  setSecret: vi.fn<(key: Uint8Array) => Promise<void>>(),
}));

vi.mock("@napi-rs/keyring", () => ({
  AsyncEntry: class {
    getSecret = keyring.getSecret;
    setSecret = keyring.setSecret;
  },
}));

describe("Desktop session storage", () => {
  beforeEach(() => {
    let storedKey: Uint8Array | undefined;
    keyring.getSecret.mockReset().mockImplementation(async () => storedKey);
    keyring.setSecret.mockReset().mockImplementation(async (key) => {
      storedKey = key;
    });
  });

  const setup = async (onTestFinished: (cleanup: () => Promise<void>) => void) => {
    const directory = await mkdtemp(join(tmpdir(), "pipelab-desktop-auth-"));
    onTestFinished(() => rm(directory, { recursive: true, force: true }));
    const path = join(directory, "auth-session.json");
    return { path, storage: new DesktopAuthStorage(path) };
  };

  it("encrypts a new session and restores it in a fresh adapter", async ({ onTestFinished }) => {
    const { path, storage } = await setup(onTestFinished);
    await expect(storage.getItem("session")).resolves.toBeNull();
    expect(keyring.getSecret).not.toHaveBeenCalled();
    await storage.setItem("session", "refresh-token");
    await storage.setItem("verifier", "pkce");

    expect(await readFile(path, "utf8")).not.toContain("refresh-token");
    expect(keyring.setSecret).toHaveBeenCalledOnce();
    expect(keyring.setSecret.mock.calls[0]?.[0].byteLength).toBe(32);
    if (process.platform !== "win32") expect((await stat(path)).mode & 0o777).toBe(0o600);

    const reopened = new DesktopAuthStorage(path);
    await expect(reopened.getItem("verifier")).resolves.toBe("pkce");
    await reopened.removeItem("verifier");
    await expect(reopened.getItem("session")).resolves.toBe("refresh-token");
    await reopened.removeItem("session");
    await reopened.removeItem("session");
    await expect(stat(path)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("serializes concurrent writes and initializes a single key", async ({ onTestFinished }) => {
    const { path, storage } = await setup(onTestFinished);
    const second = new DesktopAuthStorage(path);
    await Promise.all([storage.setItem("session", "first"), second.setItem("verifier", "second")]);

    await expect(storage.getItem("session")).resolves.toBe("first");
    await expect(storage.getItem("verifier")).resolves.toBe("second");
    expect(keyring.setSecret).toHaveBeenCalledOnce();
  });

  it("requires consent before saving a session without encryption", async ({ onTestFinished }) => {
    const { path, storage } = await setup(onTestFinished);
    keyring.getSecret.mockRejectedValue(new Error("keyring locked"));
    const authenticate = vi.fn(async () => storage.setItem("session", "session-token"));

    await expect(storage.runPasswordAuth(false, authenticate)).resolves.toBeNull();
    expect(authenticate).not.toHaveBeenCalled();
    await expect(stat(path)).rejects.toMatchObject({ code: "ENOENT" });

    await storage.runPasswordAuth(true, authenticate);
    expect(await readFile(path, "utf8")).toContain("session-token");
    if (process.platform !== "win32") expect((await stat(path)).mode & 0o777).toBe(0o600);

    const reopened = new DesktopAuthStorage(path);
    await expect(reopened.getItem("session")).resolves.toBe("session-token");
    await reopened.setItem("session", "refreshed-token");
    await expect(reopened.getItem("session")).resolves.toBe("refreshed-token");
    await reopened.removeItem("session");
    await expect(stat(path)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("encrypts a new password session when the keyring is available", async ({
    onTestFinished,
  }) => {
    const { path, storage } = await setup(onTestFinished);
    await storage.runPasswordAuth(true, () => storage.setItem("session", "secure-token"));
    expect(await readFile(path, "utf8")).not.toContain("secure-token");
    await expect(storage.getItem("session")).resolves.toBe("secure-token");
  });

  it("rejects an encrypted session that fails authentication", async ({ onTestFinished }) => {
    const { storage } = await setup(onTestFinished);
    await storage.setItem("session", "saved-token");
    keyring.getSecret.mockResolvedValue(new Uint8Array(32));
    await expect(storage.getItem("session")).rejects.toThrow("Could not decrypt");
  });

  it("allows a fresh sign-in when the old key is missing", async ({ onTestFinished }) => {
    const { path, storage } = await setup(onTestFinished);
    await storage.setItem("session", "old-token");
    const sealed = await readFile(path, "utf8");
    keyring.getSecret.mockResolvedValueOnce(undefined);

    await expect(storage.getItem("session")).rejects.toThrow("encryption key");
    await expect(readFile(path, "utf8")).resolves.toBe(sealed);
    keyring.getSecret.mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined);

    await storage.setItem("session", "new-token");
    await expect(storage.getItem("session")).resolves.toBe("new-token");
  });

  it("discards a saved session", async ({ onTestFinished }) => {
    const { path, storage } = await setup(onTestFinished);
    await storage.setItem("session", "old-token");
    await storage.discard();
    await expect(stat(path)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(storage.getItem("session")).resolves.toBeNull();
  });
});
