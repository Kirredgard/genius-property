import { describe, it, expect } from 'vitest';
import { buildStoragePath, sanitizeFilename, sanitizeSegment } from '../../../js/v21/storage/storage.service.js';

describe('storage service', () => {
  it('nettoie les segments', () => {
    expect(sanitizeSegment('Agence Dakar / Nord')).toBe('Agence-Dakar-Nord');
  });

  it('nettoie les noms de fichiers', () => {
    expect(sanitizeFilename('quittance / mai.pdf')).toBe('quittance-mai.pdf');
  });

  it('construit un chemin storage', () => {
    const path = buildStoragePath({
      agencyId: 'agency1',
      folder: 'receipts',
      entityId: 'tenant1',
      filename: 'receipt.pdf'
    });

    expect(path).toBe('agencies/agency1/receipts/tenant1/receipt.pdf');
  });
});
