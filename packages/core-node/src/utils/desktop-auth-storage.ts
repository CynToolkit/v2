import { AsyncLocalStorage } from "node:async_hooks";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import type { SupportedStorage } from "@supabase/supabase-js";
import { hasErrorCode, isRecord } from "@pipelab/shared";
import { serializeFileMutation } from "../release-persistence-lock";
import { writeJsonFileAtomically } from "./atomic-json";

class CredentialStoreUnavailable extends Error {}

const parseValues = (data: unknown): Record<string, string> => {
  const entries: [string, string][] = [];
  if (isRecord(data)) {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value !== "string") {
        throw new Error("The saved Pipelab session has an invalid format.");
      }
      entries.push([key, value]);
    }
    return Object.fromEntries(entries);
  }
  throw new Error("The saved Pipelab session has an invalid format.");
};

export class DesktopAuthStorage implements SupportedStorage {
  private readonly filePath: string;
  private readonly passwordSession = new AsyncLocalStorage<{ key: Buffer | null }>();

  constructor(filePath: string) {
    this.filePath = resolve(filePath);
  }

  private async getKey(): Promise<Buffer | null>;
  private async getKey(create: true): Promise<Buffer>;
  private async getKey(create = false): Promise<Buffer | null> {
    try {
      const { AsyncEntry } = await import("@napi-rs/keyring");
      const entry = new AsyncEntry("Pipelab Desktop session key", this.filePath);
      const storedKey = await entry.getSecret();
      if (storedKey) {
        const key = Buffer.from(storedKey);
        if (key.byteLength === 32) return key;
      } else {
        if (!create) return null;
        const key = randomBytes(32);
        await entry.setSecret(key);
        return key;
      }
    } catch {
      throw new CredentialStoreUnavailable("The operating system credential store is unavailable.");
    }
    throw new Error("The encryption key for the saved Pipelab session is unavailable.");
  }

  async runPasswordAuth<T>(allowPlaintext: boolean, authenticate: () => Promise<T>) {
    let key: Buffer | null;
    try {
      key = await serializeFileMutation(this.filePath, () => this.getKey(true));
    } catch (error) {
      if (!(error instanceof CredentialStoreUnavailable)) throw error;
      if (!allowPlaintext) return null;
      key = null;
    }
    return this.passwordSession.run({ key }, authenticate);
  }

  private async read(allowMissingKey = false) {
    let data: unknown;
    try {
      data = JSON.parse(await readFile(this.filePath, "utf8"));
    } catch (error) {
      if (hasErrorCode(error, "ENOENT")) return null;
      throw new Error("Could not read the saved Pipelab session.");
    }

    if (isRecord(data) && data.version === 1 && data.storage === "plaintext") {
      return { values: parseValues(data.values), key: null };
    }

    if (
      !isRecord(data) ||
      data.version !== 1 ||
      typeof data.iv !== "string" ||
      typeof data.tag !== "string" ||
      typeof data.ciphertext !== "string"
    ) {
      throw new Error("The saved Pipelab session has an invalid format.");
    }
    const key = await this.getKey();
    // Keep the sealed file until a fresh sign-in can replace it.
    if (!key) {
      if (allowMissingKey) return null;
      throw new Error("The encryption key for the saved Pipelab session is unavailable.");
    }
    try {
      const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(data.iv, "base64"), {
        authTagLength: 16,
      });
      decipher.setAuthTag(Buffer.from(data.tag, "base64"));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(data.ciphertext, "base64")),
        decipher.final(),
      ]);
      const decoded: unknown = JSON.parse(plaintext.toString("utf8"));
      return { values: parseValues(decoded), key };
    } catch {
      throw new Error("Could not decrypt the saved Pipelab session.");
    }
  }

  private async write(values: Record<string, string>, key: Buffer | null) {
    if (!key) {
      await writeJsonFileAtomically(
        this.filePath,
        { version: 1, storage: "plaintext", values },
        0o600,
      );
      return;
    }
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(values), "utf8"),
      cipher.final(),
    ]);
    await writeJsonFileAtomically(
      this.filePath,
      {
        version: 1,
        iv: iv.toString("base64"),
        tag: cipher.getAuthTag().toString("base64"),
        ciphertext: ciphertext.toString("base64"),
      },
      0o600,
    );
  }

  async getItem(key: string): Promise<string | null> {
    const data = await this.read();
    return data && Object.hasOwn(data.values, key) ? data.values[key] : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    await serializeFileMutation(this.filePath, async () => {
      const passwordSession = this.passwordSession.getStore();
      if (passwordSession) {
        await this.write({ [key]: value }, passwordSession.key);
        return;
      }
      const data = await this.read(true);
      await this.write(
        { ...data?.values, [key]: value },
        data ? data.key : await this.getKey(true),
      );
    });
  }

  /** Delete the saved session, e.g. when it can no longer be read. */
  async discard(): Promise<void> {
    await serializeFileMutation(this.filePath, () => rm(this.filePath, { force: true }));
  }

  async removeItem(key: string): Promise<void> {
    // Password auth replaces the saved session after Supabase clears its old verifier.
    if (this.passwordSession.getStore()) return;
    await serializeFileMutation(this.filePath, async () => {
      const data = await this.read(true);
      if (!data || !Object.hasOwn(data.values, key)) return;
      delete data.values[key];
      if (Object.keys(data.values).length === 0) await rm(this.filePath, { force: true });
      else await this.write(data.values, data.key);
    });
  }
}
