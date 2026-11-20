export interface ForgeArtifactMetadata {
  checksum?: string;
  size?: number;
  name?: string;
}

export interface ForgeResult {
  folder: string;
  binary: string | undefined;
}
