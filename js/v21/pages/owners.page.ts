import { removeOwner, bindArchiveActions } from '../actions/list-actions.js';
import { removeOwner, saveOwner, renderForm, readFormData, setFormMessage } from '../forms/form-utils.js';
import { removeOwner, saveOwner, initOwnersModule } from '../modules/owners/owners.module.js';

export async function initOwnersPage() {
  await initOwnersModule({ rootSelector: '#owners-root' });

        const form = renderForm('#owners-form-root', 'Ajouter un propriétaire', [{ name: 'firstName', label: 'Prénom', type: 'text' },{ name: 'lastName', label: 'Nom', type: 'text' },{ name: 'phone', label: 'Téléphone', type: 'text' },{ name: 'email', label: 'Email', type: 'email' },{ name: 'address', label: 'Adresse', type: 'text' }]);
        if (form) {
          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const result = await saveOwner(readFormData(form));
            if (result.ok) {
              setFormMessage(form, 'Enregistré avec succès.', 'success');
              form.reset();
            } else {
              setFormMessage(form, (result.errors || ['Erreur inconnue']).join(', '), 'error');
            }
          });
        }


  
  bindArchiveActions('#owners-root', '.v21-action-button', removeOwner);

  document.dispatchEvent(new CustomEvent('gp:v21-owners-page-ready'));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOwnersPage, { once: true });
  } else {
    initOwnersPage();
  }
}
