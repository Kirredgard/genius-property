import { removeProperty, bindArchiveActions } from '../actions/list-actions.js';
import { removeProperty, saveProperty, renderForm, readFormData, setFormMessage } from '../forms/form-utils.js';
import { removeProperty, saveProperty, initPropertiesModule } from '../modules/properties/properties.module.js';

export async function initPropertiesPage() {
  await initPropertiesModule({ rootSelector: '#properties-root' });

        const form = renderForm('#properties-form-root', 'Ajouter un bien', [{ name: 'title', label: 'Nom du bien', type: 'text' },{ name: 'address', label: 'Adresse', type: 'text' },{ name: 'city', label: 'Ville', type: 'text' },{ name: 'monthlyRent', label: 'Loyer mensuel', type: 'number' },{ name: 'ownerId', label: 'ID propriétaire', type: 'text' }]);
        if (form) {
          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const result = await saveProperty(readFormData(form));
            if (result.ok) {
              setFormMessage(form, 'Enregistré avec succès.', 'success');
              form.reset();
            } else {
              setFormMessage(form, (result.errors || ['Erreur inconnue']).join(', '), 'error');
            }
          });
        }


  
  bindArchiveActions('#properties-root', '.v21-action-button', removeProperty);

  document.dispatchEvent(new CustomEvent('gp:v21-properties-page-ready'));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPropertiesPage, { once: true });
  } else {
    initPropertiesPage();
  }
}
