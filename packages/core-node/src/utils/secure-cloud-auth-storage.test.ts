import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PipelabContext } from "../context";

const keyring = vi.hoisted(() => ({ password: null as string | null }));

vi.mock("@napi-rs/keyring", () => ({
  Entry: class {
    getPassword() {
      return keyring.password;
    }
    setPassword(value: string) {
      keyring.password = value;
    }
    deletePassword() {
      keyring.password = null;
    }
  },
}));

import { SecureCloudAuthStorage } from "./secure-cloud-auth-storage";
import { partialDouble } from "@pipelab/shared/test-doubles";

describe("SecureCloudAuthStorage", () => {
  beforeEach(() => {
    keyring.password = null;
  });

  it("stores and restores Supabase sessions through the OS credential entry", async () => {
    const context = partialDouble<PipelabContext>({
      getConfigPath: () => "/pipelab/user-data/cloud-auth-session",
    });
    const storage = new SecureCloudAuthStorage(context);

    await storage.setItem("supabase.auth.token", "session-payload");

    expect(keyring.password).toContain("session-payload");
    expect(await storage.getItem("supabase.auth.token")).toBe("session-payload");
  });

  it("removes the credential when the last stored session value is removed", async () => {
    const context = partialDouble<PipelabContext>({
      getConfigPath: () => "/pipelab/user-data/cloud-auth-session",
    });
    const storage = new SecureCloudAuthStorage(context);
    await storage.setItem("supabase.auth.token", "session-payload");

    await storage.removeItem("supabase.auth.token");
    await storage.removeItem("supabase.auth.token-code-verifier");

    expect(keyring.password).toBeNull();
    expect(await storage.getItem("supabase.auth.token")).toBeNull();
  });

  it("keeps malformed credentials out of the error and its cause", async () => {
    const context = partialDouble<PipelabContext>({
      getConfigPath: () => "/pipelab/user-data/cloud-auth-session",
    });
    const storage = new SecureCloudAuthStorage(context);
    keyring.password = "invalid-secret-payload";

    const read = storage.getItem("supabase.auth.token");
    await expect(read).rejects.toThrow(
      "Could not read Pipelab Cloud sign-in from the operating system credential store.",
    );
    await expect(read).rejects.not.toHaveProperty("cause");
  });
});
