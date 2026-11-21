import type { SupportedStorage } from "@supabase/supabase-js";
import { isRecord } from "@pipelab/shared";
import type { PipelabContext } from "../context";

interface KeyringEntry {
  getPassword(): string | null | Promise<string | null>;
  setPassword(password: string): unknown;
  deletePassword(): unknown;
}

/** Supabase Auth storage backed by the operating system credential store. */
export class SecureCloudAuthStorage implements SupportedStorage {
  private entryPromise?: Promise<KeyringEntry>;
  private readonly account: string;

  constructor(context: PipelabContext) {
    this.account = context.getConfigPath("cloud-auth-session");
  }

  private getEntry() {
    this.entryPromise ??= import("@napi-rs/keyring")
      .then(({ Entry }) => new Entry("Pipelab CLI", this.account))
      .catch(() => {
        throw new Error(
          "Pipelab Cloud CLI sign-in needs an available operating system credential store.",
        );
      });
    return this.entryPromise;
  }

  private async read(entry: KeyringEntry): Promise<Record<string, string>> {
    try {
      const password = await entry.getPassword();
      if (!password) return {};
      const data: unknown = JSON.parse(password);
      if (!isRecord(data)) return {};
      return Object.fromEntries(
        Object.entries(data).filter(
          (item): item is [string, string] => typeof item[1] === "string",
        ),
      );
    } catch {
      throw new Error(
        "Could not read Pipelab Cloud sign-in from the operating system credential store.",
      );
    }
  }

  async getItem(key: string): Promise<string | null> {
    const data = await this.read(await this.getEntry());
    return Object.hasOwn(data, key) ? data[key] : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    const entry = await this.getEntry();
    const data = await this.read(entry);
    try {
      await entry.setPassword(JSON.stringify({ ...data, [key]: value }));
    } catch {
      throw new Error(
        "Could not save Pipelab Cloud sign-in to the operating system credential store.",
      );
    }
  }

  async removeItem(key: string): Promise<void> {
    const entry = await this.getEntry();
    const data = await this.read(entry);
    if (!Object.hasOwn(data, key)) return;
    delete data[key];
    try {
      if (Object.keys(data).length) await entry.setPassword(JSON.stringify(data));
      else await entry.deletePassword();
    } catch {
      throw new Error(
        "Could not clear Pipelab Cloud sign-in from the operating system credential store.",
      );
    }
  }
}
