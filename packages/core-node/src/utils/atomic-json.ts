import { hasErrorCode } from "@pipelab/shared";
import { randomUUID } from "node:crypto";
import { link, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export class JsonFileMissingError extends Error {
  constructor(public readonly filePath: string) {
    super(`JSON file not found: ${filePath}`);
    this.name = "JsonFileMissingError";
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
    throw new Error(
      `Malformed JSON in ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
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
