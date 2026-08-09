import { removeTenant, bindArchiveActions } from '../actions/list-actions.js';
import { removeTenant, saveTenant, renderForm, readFormData, setFormMessage } from '../forms/form-utils.js';
import { removeTenant, saveTenant, initTenantsModule } from '../modules/tenants/tenants.module.js';

export async function initTenantsPage() {
  await initTenantsModule({ rootSelector: '#tenants-root' });

        const form = renderForm('#tenants-form-root', 'Ajouter un locataire', [{ name: 'firstName', label: 'Prénom', type: 'text' },{ name: 'lastName', label: 'Nom', type: 'text' },{ name: 'phone', label: 'Téléphone', type: 'text' },{ name: 'email', label: 'Email', type: 'email' },{ name: 'propertyId', label: 'ID bien', type: 'text' },{ name: 'monthlyRent', label: 'Loyer mensuel', type: 'number' }]);
        if (form) {
          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const result = await saveTenant(readFormData(form));
            if (result.ok) {
              setFormMessage(form, 'Enregistré avec succès.', 'success');
              form.reset();
            } else {
              setFormMessage(form, (result.errors || ['Erreur inconnue']).join(', '), 'error');
            }
          });
        }


  
  bindArchiveActions('#tenants-root', '.v21-action-button', removeTenant);

  document.dispatchEvent(new CustomEvent('gp:v21-tenants-page-ready'));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTenantsPage, { once: true });
  } else {
    initTenantsPage();
  }
}
