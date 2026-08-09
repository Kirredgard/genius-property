import { uploadDocument, deleteDocument } from '../storage/storage.service.js';

function getEl<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector(selector);
}

let lastUploadedPath = '';

export function initStorageTestPage() {
  const form = getEl<HTMLFormElement>('#storage-test-form');
  const fileInput = getEl<HTMLInputElement>('#storage-file');
  const output = getEl<HTMLElement>('#storage-test-output');
  const deleteButton = getEl<HTMLButtonElement>('#storage-delete-last');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const file = fileInput?.files?.[0];

    if (!file) {
      render('Choisis un fichier avant upload.');
      return;
    }

    try {
      render('Upload en cours...');

      const uploaded = await uploadDocument(file, {
        folder: 'test-uploads',
        entityId: 'manual-test',
        filename: file.name,
        contentType: file.type
      });

      lastUploadedPath = uploaded.path;
      render(JSON.stringify(uploaded, null, 2));
    } catch (error) {
      render(`Erreur Storage: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  deleteButton?.addEventListener('click', async () => {
    if (!lastUploadedPath) {
      render('Aucun fichier uploadé à supprimer.');
      return;
    }

    try {
      const ok = await deleteDocument(lastUploadedPath);
      render(ok ? `Fichier supprimé: ${lastUploadedPath}` : 'Suppression impossible.');
      lastUploadedPath = '';
    } catch (error) {
      render(`Erreur suppression Storage: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  function render(text: string) {
    if (!output) return;
    output.textContent = text;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStorageTestPage, { once: true });
  } else {
    initStorageTestPage();
  }
}
