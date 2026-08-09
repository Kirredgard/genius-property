import { describe, it, expect } from 'vitest';
import { normalizeDocumentMetadata } from '../../../js/v21/modules/documents/adapters/document.metadata.adapter.js';

describe('document metadata adapter', () => {
  it('normalise les métadonnées document', () => {
    const meta = normalizeDocumentMetadata({
      path: 'agencies/a1/documents/receipts/r1.pdf',
      filename: 'r1.pdf',
      documentType: 'receipt',
      entityId: 'tenant1',
      size: '1200'
    });

    expect(meta.documentType).toBe('receipt');
    expect(meta.entityId).toBe('tenant1');
    expect(meta.size).toBe(1200);
    expect(meta.uploadedAt).toBeTruthy();
  });
});
