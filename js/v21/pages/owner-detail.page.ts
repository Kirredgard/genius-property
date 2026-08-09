import { saveOwner } from '../modules/owners/owners.module.js';
import { getEntityIdFromURL, renderEntityDetailForm, readDetailForm, setDetailMessage } from '../details/entity-detail.js';

export async function initOwnerDetailPage() {
  const id = getEntityIdFromURL();
  const list = window?.GPV21Owners?.state?.().owners || [];
  const entity = list.find((item) => item.id === id) || { id };

  const form = renderEntityDetailForm('#owner-detail-root', 'Modifier le propriétaire', [{ name: 'firstName', label: 'Prénom', type: 'text' },{ name: 'lastName', label: 'Nom', type: 'text' },{ name: 'phone', label: 'Téléphone', type: 'text' },{ name: 'email', label: 'Email', type: 'email' },{ name: 'address', label: 'Adresse', type: 'text' }], entity);
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await saveOwner({ ...readDetailForm(form), id });

    if (result.ok) {
      setDetailMessage(form, 'Mise à jour effectuée.', 'success');
    } else {
      setDetailMessage(form, (result.errors || ['Erreur inconnue']).join(', '), 'error');
    }
  });

  document.dispatchEvent(new CustomEvent('gp:v21-owner-detail-ready'));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOwnerDetailPage, { once: true });
  } else {
    initOwnerDetailPage();
  }
}
