import {
  useLogger,
  defaultConnections,
  defaultFileRepo,
  parseConnectionsConfig,
  parseFileRepo,
  type ConnectionsConfig,
  type FileRepo,
} from "@pipelab/shared";
import type { PipelabContext } from "./context";
import {
  JsonFileMissingError,
  readJsonFile,
  writeJsonFileAtomically,
  writeJsonFileAtomicallyIfMissing,
} from "./utils/atomic-json";
import {
  getConnectionSecretKey,
  hasPlaintextSecrets,
  hasSealedSecrets,
  sealConnections,
  unsealConnections,
} from "./utils/connection-secrets";
import { serializeFileMutation } from "./release-persistence-lock";

export const loadStrictProjects = async (context: PipelabContext): Promise<FileRepo> => {
  try {
    return parseFileRepo(await readJsonFile(context.getProjectsPath()));
  } catch (error) {
    if (error instanceof JsonFileMissingError) {
      const created = await writeJsonFileAtomicallyIfMissing(
        context.getProjectsPath(),
        defaultFileRepo,
      );
      if (created) return defaultFileRepo;
      return parseFileRepo(await readJsonFile(context.getProjectsPath()));
    }
    throw error;
  }
};

export const saveStrictProjects = async (
  context: PipelabContext,
  value: FileRepo,
): Promise<void> => {
  await serializeFileMutation(context.getProjectsPath(), async () => {
    const next = parseFileRepo(value);
    const current = await loadStrictProjects(context);
    for (const workflow of current.workflows || [])
      if (!next.projects.some((project) => project.id === workflow.project))
        throw new Error(
          `Project '${workflow.project}' cannot be deleted while workflow '${workflow.id}' references it.`,
        );
    if (JSON.stringify(current.workflows || []) !== JSON.stringify(next.workflows || []))
      throw new Error("Workflow index entries can only be changed through ReleasePersistence.");
    await writeJsonFileAtomically(context.getProjectsPath(), next);
  });
};

const readConnectionsFile = async (context: PipelabContext) => {
  try {
    return parseConnectionsConfig(await readJsonFile(context.getConnectionsPath()));
  } catch (error) {
    if (error instanceof JsonFileMissingError) {
      const created = await writeJsonFileAtomicallyIfMissing(
        context.getConnectionsPath(),
        defaultConnections,
      );
      if (created) return defaultConnections;
      return parseConnectionsConfig(await readJsonFile(context.getConnectionsPath()));
    }
    throw error;
  }
};

/** Writes connections sealed with the keyring key, or 0600 plaintext when no keyring exists. */
const writeConnectionsFile = async (context: PipelabContext, value: ConnectionsConfig) => {
  const path = context.getConnectionsPath();
  const key = hasPlaintextSecrets(value) ? await getConnectionSecretKey(path, true) : null;
  if (!key && hasPlaintextSecrets(value))
    useLogger()
      .logger()
      .warn(
        "[Connections] The operating system credential store is unavailable; saved connection values are kept in a user-only file instead.",
      );
  await writeJsonFileAtomically(
    path,
    parseConnectionsConfig(key ? sealConnections(value, key) : value),
    0o600,
  );
};

/**
 * Loads connections with their values decrypted. Existing plaintext values are
 * migrated to protected storage on first load when a credential store exists.
 */
export const loadStrictConnections = async (
  context: PipelabContext,
): Promise<ConnectionsConfig> => {
  const path = context.getConnectionsPath();
  const raw = await readConnectionsFile(context);
  const key = hasSealedSecrets(raw) ? await getConnectionSecretKey(path, false) : null;
  const config = unsealConnections(raw, key);
  if (hasPlaintextSecrets(raw) && (await getConnectionSecretKey(path, true))) {
    await serializeFileMutation(path, async () => {
      const current = await readConnectionsFile(context);
      if (hasPlaintextSecrets(current)) await writeConnectionsFile(context, current);
    });
  }
  return config;
};

export const saveStrictConnections = async (
  context: PipelabContext,
  value: ConnectionsConfig,
): Promise<void> => {
  await serializeFileMutation(context.getConnectionsPath(), () =>
    writeConnectionsFile(context, parseConnectionsConfig(value)),
  );
};
