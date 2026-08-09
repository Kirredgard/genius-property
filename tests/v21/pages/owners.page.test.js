import { describe, it, expect, beforeEach } from 'vitest';
import { initOwnersPage } from '../../../js/v21/pages/owners.page.js';

describe('owners page', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="owners-root"></div>';
  });

  it('initialise la page owners', async () => {
    await initOwnersPage();
    expect(document.querySelector('#owners-root')).toBeTruthy();
  });
});
