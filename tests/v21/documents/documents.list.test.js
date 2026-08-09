import { describe, it, expect, beforeEach } from 'vitest';
import { renderDocumentsList, renderDocumentsEmptyState } from '../../../js/v21/modules/documents/ui/documents.list.js';

describe('documents list UI', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="documents-root"></div>';
  });

  it('affiche un état vide', () => {
    renderDocumentsEmptyState('#documents-root');
    expect(document.querySelector('#documents-root').textContent).toContain('Aucun document');
  });

  it('affiche une liste de documents', () => {
    renderDocumentsList([{
      id: 'd1',
      filename: 'quittance.pdf',
      documentType: 'receipt',
      entityId: 'tenant1',
      size: 2048,
      uploadedAt: '2026-01-01T00:00:00.000Z'
    }], '#documents-root');

    expect(document.querySelector('#documents-root').textContent).toContain('quittance.pdf');
    expect(document.querySelector('#documents-root').textContent).toContain('receipt');
  });
});
