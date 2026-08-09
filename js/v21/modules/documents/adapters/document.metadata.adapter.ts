export interface DocumentMetadataInput {
  id?: string;
  path: string;
  url?: string;
  filename: string;
  documentType: string;
  entityId: string;
  contentType?: string;
  size?: number;
  uploadedAt?: string;
}

export function normalizeDocumentMetadata(input: DocumentMetadataInput) {
  return {
    id: input.id || '',
    path: input.path,
    url: input.url || '',
    filename: input.filename,
    documentType: input.documentType,
    entityId: input.entityId,
    contentType: input.contentType || '',
    size: Number(input.size || 0),
    uploadedAt: input.uploadedAt || new Date().toISOString()
  };
}
