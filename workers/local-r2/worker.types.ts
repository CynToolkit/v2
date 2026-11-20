export interface R2ObjectMetadataHttpMetadata {
  contentType?: string;
}

export interface PutOptions {
  httpMetadata?: R2ObjectMetadataHttpMetadata;
  customMetadata?: Record<string, string>;
  md5?: string;
  onlyIf?: Headers;
}
