import { initDocumentsModule } from '../modules/documents/documents.module.js';

export async function initDocumentsPage() {
  await initDocumentsModule({ rootSelector: '#documents-root' });

  document.dispatchEvent(new CustomEvent('gp:v21-documents-page-ready'));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDocumentsPage, { once: true });
  } else {
    initDocumentsPage();
  }
}
