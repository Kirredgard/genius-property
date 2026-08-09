import { describe, it, expect, beforeEach } from 'vitest';
import { initContractsPage } from '../../../js/v21/pages/contracts.page.js';

describe('contracts page', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="contracts-root"></div>';
  });

  it('initialise la page contracts', async () => {
    await initContractsPage();
    expect(document.querySelector('#contracts-root')).toBeTruthy();
  });
});
