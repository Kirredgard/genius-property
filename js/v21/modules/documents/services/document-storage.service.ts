import { saveDocumentMetadata } from './document-metadata.service.js';
import { uploadDocument, deleteDocument, type UploadedDocument } from '../../../storage/storage.service.js';

export interface DocumentUploadInput {
  file: Blob | File;
  agencyId?: string;
  entityId?: string;
  documentType?: string;
  filename?: string;
  contentType?: string;
}

export interface BusinessDocument extends UploadedDocument {
  documentType: string;
  entityId: string;
  uploadedAt: string;
}

export async function uploadBusinessDocument(input: DocumentUploadInput): Promise<BusinessDocument> {
  const documentType = input.documentType || 'document';
  const entityId = input.entityId || 'general';

  const uploaded = await uploadDocument(input.file, {
    agencyId: input.agencyId,
    folder: `documents/${documentType}`,
    entityId,
    filename: input.filename,
    contentType: input.contentType
  });

  return {
    ...uploaded,
    documentType,
    entityId,
    uploadedAt: new Date().toISOString()
  };
}

export async function deleteBusinessDocument(path: string): Promise<boolean> {
  return deleteDocument(path);
}


export async function uploadAndSaveBusinessDocument(input: DocumentUploadInput): Promise<BusinessDocument> {
  const uploaded = await uploadBusinessDocument(input);
  await saveDocumentMetadata(uploaded, { agencyId: input.agencyId });
  return uploaded;
}
