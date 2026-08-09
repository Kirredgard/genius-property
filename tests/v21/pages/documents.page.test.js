import { describe, it, expect, beforeEach } from 'vitest';
import { initDocumentsPage } from '../../../js/v21/pages/documents.page.js';

describe('documents page', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="documents-root"></div>';
  });

  it('initialise la page documents', async () => {
    await initDocumentsPage();
    expect(document.querySelector('#documents-root')).toBeTruthy();
  });
});
