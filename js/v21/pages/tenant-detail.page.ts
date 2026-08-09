import { saveTenant } from '../modules/tenants/tenants.module.js';
import { getEntityIdFromURL, renderEntityDetailForm, readDetailForm, setDetailMessage } from '../details/entity-detail.js';

export async function initTenantDetailPage() {
  const id = getEntityIdFromURL();
  const list = window?.GPV21Tenants?.state?.().tenants || [];
  const entity = list.find((item) => item.id === id) || { id };

  const form = renderEntityDetailForm('#tenant-detail-root', 'Modifier le locataire', [{ name: 'firstName', label: 'Prénom', type: 'text' },{ name: 'lastName', label: 'Nom', type: 'text' },{ name: 'phone', label: 'Téléphone', type: 'text' },{ name: 'email', label: 'Email', type: 'email' },{ name: 'propertyId', label: 'ID bien', type: 'text' }], entity);
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await saveTenant({ ...readDetailForm(form), id });

    if (result.ok) {
      setDetailMessage(form, 'Mise à jour effectuée.', 'success');
    } else {
      setDetailMessage(form, (result.errors || ['Erreur inconnue']).join(', '), 'error');
    }
  });

  document.dispatchEvent(new CustomEvent('gp:v21-tenant-detail-ready'));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTenantDetailPage, { once: true });
  } else {
    initTenantDetailPage();
  }
}
