export interface PreparedUploadReservation {
  reservationId: string;
}

export interface PreparedSingleUpload {
  uploadUrl: string;
  headers: Record<string, string>;
}

export interface PreparedMultipartUpload {
  multipart: true;
  uploadId: string;
  partSize: number;
}

export interface CreateCloudArtifactUploadMetadataArtifact {
  version: string;
  originalName: string;
  artifactKind: "file" | "directory";
}

export interface CreateCloudArtifactUploadMetadataIdentity {
  projectId: string;
  buildProfileId: string;
  buildTargetId: string;
}

export interface MultipartParts {
  PartNumber: number;
  ETag: string;
}
