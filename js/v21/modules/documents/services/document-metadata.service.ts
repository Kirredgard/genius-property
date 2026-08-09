import { getDemoCollection } from '../../../demo/demo-data.js';
import { createDocument, listDocuments, updateDocument, softDeleteDocument } from '../../../data/firestore.repository.js';
import { normalizeDocumentMetadata, type DocumentMetadataInput } from '../adapters/document.metadata.adapter.js';

export const COLLECTION_NAME = 'documents';

export async function saveDocumentMetadata(input: DocumentMetadataInput, options: { agencyId?: string; db?: unknown } = {}) {
  const data = normalizeDocumentMetadata(input);

  if (data.id) {
    return updateDocument(data.id, data, {
      collectionName: COLLECTION_NAME,
      agencyId: options.agencyId,
      db: options.db
    });
  }

  return createDocument(data, {
    collectionName: COLLECTION_NAME,
    agencyId: options.agencyId,
    db: options.db
  });
}

export async function listDocumentMetadata(options: { agencyId?: string; db?: unknown; entityId?: string; documentType?: string } = {}) {
  const demoRows = getDemoCollection('documents');
      if (demoRows.length) return demoRows;

      const rows = await listDocuments<DocumentMetadataInput>({
    collectionName: COLLECTION_NAME,
    agencyId: options.agencyId,
    db: options.db
  });

  return rows
    .map(normalizeDocumentMetadata)
    .filter((item) => !options.entityId || item.entityId === options.entityId)
    .filter((item) => !options.documentType || item.documentType === options.documentType);
}

export async function archiveDocumentMetadata(documentId: string, options: { agencyId?: string; db?: unknown } = {}) {
  return softDeleteDocument(documentId, {
    collectionName: COLLECTION_NAME,
    agencyId: options.agencyId,
    db: options.db
  });
}
