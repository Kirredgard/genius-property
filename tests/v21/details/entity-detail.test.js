import { describe, it, expect, beforeEach } from 'vitest';
import { renderEntityDetailForm, readDetailForm, setDetailMessage } from '../../../js/v21/details/entity-detail.js';

describe('entity detail', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="detail-root"></div>';
  });

  it('rend et lit un formulaire détail', () => {
    const form = renderEntityDetailForm('#detail-root', 'Modifier', [{ name: 'title', label: 'Titre' }], { title: 'Maison' });
    expect(form.querySelector('input[name="title"]').value).toBe('Maison');
    expect(readDetailForm(form)).toEqual({ title: 'Maison' });
  });

  it('affiche un message', () => {
    const form = renderEntityDetailForm('#detail-root', 'Modifier', [{ name: 'title', label: 'Titre' }], {});
    setDetailMessage(form, 'OK', 'success');
    expect(document.querySelector('[data-form-message]').textContent).toBe('OK');
  });
});
