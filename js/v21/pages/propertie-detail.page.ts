import { saveProperty } from '../modules/properties/properties.module.js';
import { getEntityIdFromURL, renderEntityDetailForm, readDetailForm, setDetailMessage } from '../details/entity-detail.js';

export async function initPropertieDetailPage() {
  const id = getEntityIdFromURL();
  const list = window?.GPV21Properties?.state?.().properties || [];
  const entity = list.find((item) => item.id === id) || { id };

  const form = renderEntityDetailForm('#property-detail-root', 'Modifier le bien', [{ name: 'title', label: 'Nom', type: 'text' },{ name: 'address', label: 'Adresse', type: 'text' },{ name: 'city', label: 'Ville', type: 'text' },{ name: 'monthlyRent', label: 'Loyer', type: 'number' },{ name: 'ownerId', label: 'ID propriétaire', type: 'text' }], entity);
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await saveProperty({ ...readDetailForm(form), id });

    if (result.ok) {
      setDetailMessage(form, 'Mise à jour effectuée.', 'success');
    } else {
      setDetailMessage(form, (result.errors || ['Erreur inconnue']).join(', '), 'error');
    }
  });

  document.dispatchEvent(new CustomEvent('gp:v21-propertie-detail-ready'));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPropertieDetailPage, { once: true });
  } else {
    initPropertieDetailPage();
  }
}
