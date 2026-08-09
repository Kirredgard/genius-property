import { describe, it, expect, beforeEach } from 'vitest';
import { renderForm, readFormData, setFormMessage } from '../../../js/v21/forms/form-utils.js';

describe('form utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="form-root"></div>';
  });

  it('rend un formulaire et lit les données', () => {
    const form = renderForm('#form-root', 'Test', [{ name: 'title', label: 'Titre' }]);
    form.querySelector('input[name="title"]').value = 'Maison';

    expect(readFormData(form)).toEqual({ title: 'Maison' });
  });

  it('affiche un message', () => {
    const form = renderForm('#form-root', 'Test', [{ name: 'title', label: 'Titre' }]);
    setFormMessage(form, 'OK', 'success');

    expect(document.querySelector('[data-form-message]').textContent).toBe('OK');
  });
});
