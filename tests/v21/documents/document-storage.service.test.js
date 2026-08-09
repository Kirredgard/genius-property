import { describe, it, expect } from 'vitest';
import { uploadBusinessDocument } from '../../../js/v21/modules/documents/services/document-storage.service.js';

describe('document storage service', () => {
  it('prépare un upload avec fallback sans Firebase', async () => {
    const file = new Blob(['test'], { type: 'text/plain' });
    const uploaded = await uploadBusinessDocument({
      file,
      agencyId: 'agency1',
      entityId: 'tenant1',
      documentType: 'receipt',
      filename: 'receipt.txt'
    });

    expect(uploaded.path).toContain('documents/receipt');
    expect(uploaded.documentType).toBe('receipt');
    expect(uploaded.entityId).toBe('tenant1');
  });
});
