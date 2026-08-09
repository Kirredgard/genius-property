import { describe, it, expect } from 'vitest';
import { buildAgencyCollectionPath, createDocument, updateDocument, softDeleteDocument } from '../../../js/v21/data/firestore.repository.js';

describe('firestore repository', () => {
  it('construit un chemin agence', () => {
    expect(buildAgencyCollectionPath('a1', 'tenants')).toBe('agencies/a1/tenants');
  });

  it('retourne collection simple sans agencyId', () => {
    expect(buildAgencyCollectionPath('', 'tenants')).toBe('tenants');
  });

  it('crée un document local si Firestore indisponible', async () => {
    const doc = await createDocument({ name: 'test' }, { collectionName: 'tenants' });
    expect(doc._pendingSync).toBe(true);
    expect(doc.id).toBeTruthy();
  });

  it('met à jour un document local si Firestore indisponible', async () => {
    const doc = await updateDocument('id1', { name: 'test' }, { collectionName: 'tenants' });
    expect(doc.id).toBe('id1');
    expect(doc._pendingSync).toBe(true);
  });

  it('archive un document local si Firestore indisponible', async () => {
    const doc = await softDeleteDocument('id1', { collectionName: 'tenants' });
    expect(doc.archived).toBe(true);
    expect(doc._pendingSync).toBe(true);
  });
});
