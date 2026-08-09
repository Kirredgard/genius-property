import { getDemoCollection } from '../../../demo/demo-data.js';
import { listDocuments, createDocument, updateDocument, softDeleteDocument } from '../../../data/firestore.repository.js';
import { normalizeOwnerForFirestore, normalizeOwnerFromFirestore } from '../adapters/owner.firestore.adapter.js';

export const COLLECTION_NAME = 'owners';

export async function listOwners(options: { agencyId?: string; db?: unknown } = {}) {
  const demoRows = getDemoCollection('owners');
      if (demoRows.length) return demoRows;

      const rows = await listDocuments({
    collectionName: COLLECTION_NAME,
    agencyId: options.agencyId,
    db: options.db
  });

  return rows.map(normalizeOwnerFromFirestore);
}

export async function createOwner(payload: any, options: { agencyId?: string; db?: unknown } = {}) {
  const data = normalizeOwnerForFirestore(payload);

  return createDocument(data, {
    collectionName: COLLECTION_NAME,
    agencyId: options.agencyId,
    db: options.db
  });
}

export async function updateOwner(ownerId: string, payload: any, options: { agencyId?: string; db?: unknown } = {}) {
  const data = normalizeOwnerForFirestore(payload);

  return updateDocument(ownerId, data, {
    collectionName: COLLECTION_NAME,
    agencyId: options.agencyId,
    db: options.db
  });
}

export async function archiveOwner(ownerId: string, options: { agencyId?: string; db?: unknown } = {}) {
  return softDeleteDocument(ownerId, {
    collectionName: COLLECTION_NAME,
    agencyId: options.agencyId,
    db: options.db
  });
}
