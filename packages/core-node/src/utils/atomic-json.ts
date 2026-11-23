import { hasErrorCode, useLogger } from "@pipelab/shared";
import { randomUUID } from "node:crypto";
import { link, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export class JsonFileMissingError extends Error {
  constructor(public readonly filePath: string) {
    super(`JSON file not found: ${filePath}`);
    this.name = "JsonFileMissingError";
  }
}

export class JsonFileMalformedError extends Error {
  constructor(
    public readonly filePath: string,
    cause: unknown,
  ) {
    super(
      `Malformed JSON in ${filePath}: ${cause instanceof Error ? cause.message : String(cause)}`,
      { cause },
    );
    this.name = "JsonFileMalformedError";
  }
}

export const readJsonFile = async (filePath: string): Promise<unknown> => {
  let content: string;
  try {
    content = await readFile(filePath, "utf8");
  } catch (error) {
    if (hasErrorCode(error, "ENOENT")) throw new JsonFileMissingError(filePath);
    throw error;
  }
  try {
    const parsed: unknown = JSON.parse(content);
    return parsed;
  } catch (error) {
    throw new JsonFileMalformedError(filePath, error);
  }
};

export const writeJsonFileAtomically = async (
  filePath: string,
  value: unknown,
  mode?: number,
): Promise<void> => {
  await mkdir(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, JSON.stringify(value, null, 2), {
      encoding: "utf8",
      flag: "wx",
      mode,
    });
    await rename(temporaryPath, filePath);
  } finally {
    await rm(temporaryPath, { force: true }).catch((): void => undefined);
  }
};

export const writeJsonFileAtomicallyIfMissing = async (
  filePath: string,
  value: unknown,
): Promise<boolean> => {
  await mkdir(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, JSON.stringify(value, null, 2), {
      encoding: "utf8",
      flag: "wx",
    });
    try {
      await link(temporaryPath, filePath);
      return true;
    } catch (error) {
      if (hasErrorCode(error, "EEXIST")) return false;
      throw error;
    }
  } finally {
    await rm(temporaryPath, { force: true }).catch((): void => undefined);
  }
};

export interface RecoverableJsonOptions<T> {
  /** Shown in the log, e.g. "Projects". */
  label: string;
  path: string;
  /** Validates (and normalizes) the parsed document; throws when it is unusable. */
  parse: (value: unknown) => T;
  /** Value used when the file is missing or unreadable. */
  fallback: T;
  /** File mode for the default written after a reset. */
  mode?: number;
}

/**
 * Loads a persisted JSON document and never fails because of its content. A missing file is
 * created from the fallback. A file that is malformed or rejected by `parse` is moved to
 * `<file>.invalid-<timestamp>` (kept on disk), reported in the log only, and replaced by the
 * fallback, so the app behaves as if nothing was saved. Real I/O errors still throw.
 */
export const loadJsonOrRecover = async <T>(options: RecoverableJsonOptions<T>): Promise<T> => {
  const { path, parse, fallback } = options;
  let raw: unknown;
  try {
    raw = await readJsonFile(path);
  } catch (error) {
    if (error instanceof JsonFileMissingError) {
      const created = await writeJsonFileAtomicallyIfMissing(path, fallback);
      if (created) return fallback;
      return loadJsonOrRecover(options);
    }
    if (error instanceof JsonFileMalformedError) return recover(options, error);
    throw error;
  }
  try {
    return parse(raw);
  } catch (error) {
    return recover(options, error);
  }
};

const recover = async <T>(
  { label, path, fallback, mode }: RecoverableJsonOptions<T>,
  error: unknown,
): Promise<T> => {
  const backup = `${path}.invalid-${Date.now()}`;
  useLogger()
    .logger()
    .warn(
      `[${label}] The saved file could not be read (${error instanceof Error ? error.message : String(error)}). ` +
        `It was reset to the default; the original is kept at ${backup}.`,
    );
  await rename(path, backup);
  await writeJsonFileAtomically(path, fallback, mode);
  return fallback;
};
