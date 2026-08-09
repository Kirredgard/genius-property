import { createDocument, listDocuments } from '../data/firestore.repository.js';

function getEl<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector(selector);
}

export async function initFirestoreTestPage() {
  const form = getEl<HTMLFormElement>('#firestore-test-form');
  const output = getEl<HTMLElement>('#firestore-test-output');

  await refreshOwners();

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const payload = {
      firstName: String(data.get('firstName') || '').trim(),
      lastName: String(data.get('lastName') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      status: 'active'
    };

    try {
      await createDocument(payload, { collectionName: 'owners' });
      form.reset();
      await refreshOwners();
    } catch (error) {
      render(`Erreur Firestore: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  async function refreshOwners() {
    try {
      const owners = await listDocuments({ collectionName: 'owners' });
      render(JSON.stringify(owners, null, 2));
    } catch (error) {
      render(`Erreur lecture Firestore: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function render(text: string) {
    if (!output) return;
    output.textContent = text;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirestoreTestPage, { once: true });
  } else {
    initFirestoreTestPage();
  }
}
