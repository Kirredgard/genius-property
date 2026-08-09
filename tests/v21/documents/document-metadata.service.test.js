import { describe, it, expect } from 'vitest';
import { saveDocumentMetadata, listDocumentMetadata, archiveDocumentMetadata } from '../../../js/v21/modules/documents/services/document-metadata.service.js';

describe('document metadata service', () => {
  it('sauvegarde une métadonnée avec fallback local', async () => {
    const saved = await saveDocumentMetadata({
      path: 'documents/test.pdf',
      filename: 'test.pdf',
      documentType: 'receipt',
      entityId: 'tenant1'
    });

    expect(saved.id).toBeTruthy();
    expect(saved._pendingSync).toBe(true);
  });

  it('liste les métadonnées sans Firestore', async () => {
    const rows = await listDocumentMetadata();
    expect(Array.isArray(rows)).toBe(true);
  });

  it('archive une métadonnée avec fallback local', async () => {
    const archived = await archiveDocumentMetadata('doc1');
    expect(archived.archived).toBe(true);
  });
});
