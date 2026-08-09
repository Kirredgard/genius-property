import { saveContract } from '../modules/contracts/contracts.module.js';
import { getEntityIdFromURL, renderEntityDetailForm, readDetailForm, setDetailMessage } from '../details/entity-detail.js';

export async function initContractDetailPage() {
  const id = getEntityIdFromURL();
  const list = window?.GPV21Contracts?.state?.().contracts || [];
  const entity = list.find((item) => item.id === id) || { id };

  const form = renderEntityDetailForm('#contract-detail-root', 'Modifier le contrat', [{ name: 'tenantId', label: 'ID locataire', type: 'text' },{ name: 'propertyId', label: 'ID bien', type: 'text' },{ name: 'startDate', label: 'Date début', type: 'date' },{ name: 'endDate', label: 'Date fin', type: 'date' },{ name: 'monthlyRent', label: 'Loyer', type: 'number' },{ name: 'deposit', label: 'Caution', type: 'number' }], entity);
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await saveContract({ ...readDetailForm(form), id });

    if (result.ok) {
      setDetailMessage(form, 'Mise à jour effectuée.', 'success');
    } else {
      setDetailMessage(form, (result.errors || ['Erreur inconnue']).join(', '), 'error');
    }
  });

  document.dispatchEvent(new CustomEvent('gp:v21-contract-detail-ready'));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContractDetailPage, { once: true });
  } else {
    initContractDetailPage();
  }
}
