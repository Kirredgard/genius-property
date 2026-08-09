import { describe, it, expect, beforeEach } from 'vitest';
import { renderOwnersList, renderOwnersEmptyState } from '../../../js/v21/modules/owners/ui/owners.list.js';

describe('owners list UI', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="owners-root"></div>';
  });

  it('affiche un état vide', () => {
    renderOwnersEmptyState('#owners-root');
    expect(document.querySelector('#owners-root').textContent).toContain('Aucun propriétaire');
  });

  it('affiche une liste', () => {
    renderOwnersList([{ id: 'o1', firstName: 'Awa', lastName: 'Diop', phone: '77' }], '#owners-root');
    expect(document.querySelector('#owners-root').textContent).toContain('Awa Diop');
  });
});
