export interface RunResult {
  exitCode: number;
}

export interface ExportGodotProjectOptions {
  executable: string;
  project: string;
  preset: string;
  platform: string;
  projectName: string;
  outputDirectory: string;
  signal: AbortSignal;
  log: (stream: "stdout" | "stderr", chunk: string) => void;
  ensureDirectory: (path: string) => Promise<void>;
}

export interface ExportGodotProjectResult {
  path: string;
  size: number;
  checksum: string;
}
