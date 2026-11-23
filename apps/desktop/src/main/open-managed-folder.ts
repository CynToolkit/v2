import { mkdir } from "node:fs/promises";

export type ManagedFolderKind = "cache" | "temp";

const isManagedFolderKind = (value: unknown): value is ManagedFolderKind =>
  value === "cache" || value === "temp";

/**
 * Open one of the app-managed folders in the system file manager. The renderer
 * only names the folder; the path is always resolved in the main process, so a
 * compromised renderer cannot open arbitrary locations.
 */
export const openManagedFolder = async (
  kind: unknown,
  resolveFolder: (kind: ManagedFolderKind) => string,
  openPath: (path: string) => Promise<string>,
): Promise<void> => {
  if (!isManagedFolderKind(kind)) {
    throw new Error("Only the cache and temp folders may be opened");
  }
  const folder = resolveFolder(kind);
  await mkdir(folder, { recursive: true });
  const error = await openPath(folder);
  if (error) {
    throw new Error(`Could not open ${kind} folder: ${error}`);
  }
};
