import { describe, it, expect, beforeEach } from 'vitest';
import { initTenantsPage } from '../../../js/v21/pages/tenants.page.js';

describe('tenants page', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="tenants-root"></div>';
  });

  it('initialise la page tenants', async () => {
    await initTenantsPage();
    expect(document.querySelector('#tenants-root')).toBeTruthy();
  });
});
