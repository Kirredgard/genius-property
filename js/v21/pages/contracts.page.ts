import { closeContract, bindArchiveActions } from '../actions/list-actions.js';
import { closeContract, saveContract, renderForm, readFormData, setFormMessage } from '../forms/form-utils.js';
import { closeContract, saveContract, initContractsModule } from '../modules/contracts/contracts.module.js';

export async function initContractsPage() {
  await initContractsModule({ rootSelector: '#contracts-root' });

        const form = renderForm('#contracts-form-root', 'Créer un contrat', [{ name: 'tenantId', label: 'ID locataire', type: 'text' },{ name: 'propertyId', label: 'ID bien', type: 'text' },{ name: 'startDate', label: 'Date début', type: 'date' },{ name: 'endDate', label: 'Date fin', type: 'date' },{ name: 'monthlyRent', label: 'Loyer mensuel', type: 'number' },{ name: 'deposit', label: 'Caution', type: 'number' }]);
        if (form) {
          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const result = await saveContract(readFormData(form));
            if (result.ok) {
              setFormMessage(form, 'Enregistré avec succès.', 'success');
              form.reset();
            } else {
              setFormMessage(form, (result.errors || ['Erreur inconnue']).join(', '), 'error');
            }
          });
        }


  
  bindArchiveActions('#contracts-root', '.v21-action-button', closeContract);

  document.dispatchEvent(new CustomEvent('gp:v21-contracts-page-ready'));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContractsPage, { once: true });
  } else {
    initContractsPage();
  }
}
