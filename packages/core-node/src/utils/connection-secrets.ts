import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { isRecord, type Connection, type ConnectionsConfig } from "@pipelab/shared";

/**
 * Connection fields that stay readable on disk. Every other field is an
 * integration value (tokens, API keys, ...) and is sealed with a key held in
 * the operating system credential store.
 */
const CLEAR_FIELDS: ReadonlySet<string> = new Set([
  "id",
  "pluginName",
  "integrationName",
  "name",
  "createdAt",
  "isDefault",
  "protectedValues",
]);

const SERVICE = "Pipelab connection secrets";

export class ConnectionSecretsError extends Error {}

interface SealedValues {
  version: 1;
  iv: string;
  tag: string;
  ciphertext: string;
}

const isSealed = (value: unknown): value is SealedValues =>
  isRecord(value) &&
  value.version === 1 &&
  typeof value.iv === "string" &&
  typeof value.tag === "string" &&
  typeof value.ciphertext === "string";

const secretFields = (connection: Connection): [string, unknown][] =>
  Object.entries(connection).filter(([key]) => !CLEAR_FIELDS.has(key));

/** True when at least one connection still carries integration values in clear text. */
export const hasPlaintextSecrets = (config: ConnectionsConfig) =>
  config.connections.some((connection) => secretFields(connection).length > 0);

/** True when at least one connection is sealed. */
export const hasSealedSecrets = (config: ConnectionsConfig) =>
  config.connections.some((connection) => isSealed(connection.protectedValues));

/**
 * Returns the keyring-held key, creating it when asked. Returns null when the
 * credential store is unavailable so callers can pick the documented fallback.
 */
export const getConnectionSecretKey = async (
  account: string,
  create: boolean,
): Promise<Buffer | null> => {
  let entry: { getSecret(): Promise<Uint8Array | null | undefined> } & {
    setSecret(key: Uint8Array): Promise<unknown>;
  };
  let stored: Uint8Array | null | undefined;
  try {
    const { AsyncEntry } = await import("@napi-rs/keyring");
    entry = new AsyncEntry(SERVICE, account);
    stored = await entry.getSecret();
  } catch {
    return null;
  }
  if (stored) {
    const key = Buffer.from(stored);
    if (key.byteLength === 32) return key;
    throw new ConnectionSecretsError("The encryption key for saved connections is invalid.");
  }
  if (!create) return null;
  const key = randomBytes(32);
  try {
    await entry.setSecret(key);
  } catch {
    return null;
  }
  return key;
};

export const sealConnections = (config: ConnectionsConfig, key: Buffer): ConnectionsConfig => ({
  ...config,
  connections: config.connections.map((connection) => {
    const values = secretFields(connection);
    if (values.length === 0) return connection;
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(Object.fromEntries(values)), "utf8"),
      cipher.final(),
    ]);
    const sealed: SealedValues = {
      version: 1,
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      ciphertext: ciphertext.toString("base64"),
    };
    const sealedConnection: Connection = {
      id: connection.id,
      pluginName: connection.pluginName,
      name: connection.name,
      createdAt: connection.createdAt,
      isDefault: connection.isDefault,
      protectedValues: sealed,
    };
    if (connection.integrationName !== undefined)
      sealedConnection.integrationName = connection.integrationName;
    return sealedConnection;
  }),
});

export const unsealConnections = (config: ConnectionsConfig, key: Buffer | null) => ({
  ...config,
  connections: config.connections.map((connection): Connection => {
    const { protectedValues, ...rest } = connection;
    if (!isSealed(protectedValues)) return connection;
    if (!key)
      throw new ConnectionSecretsError(
        `Saved values for connection '${connection.name}' are protected by the operating system credential store, which is unavailable or has no key for them.`,
      );
    try {
      const decipher = createDecipheriv(
        "aes-256-gcm",
        key,
        Buffer.from(protectedValues.iv, "base64"),
        {
          authTagLength: 16,
        },
      );
      decipher.setAuthTag(Buffer.from(protectedValues.tag, "base64"));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(protectedValues.ciphertext, "base64")),
        decipher.final(),
      ]);
      const values: unknown = JSON.parse(plaintext.toString("utf8"));
      if (!isRecord(values)) throw new Error("invalid");
      return { ...rest, ...values };
    } catch {
      throw new ConnectionSecretsError(
        `Could not decrypt saved values for connection '${connection.name}'.`,
      );
    }
  }),
});
