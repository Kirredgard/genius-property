import { describe, it, expect, beforeEach } from 'vitest';
import { initRealServicesPage } from '../../../js/v21/pages/real-services.page.js';

describe('real services page', () => {
  beforeEach(() => {
    document.body.innerHTML = '<section id="real-services-root"></section>';
  });

  it('rend le point de contrôle real services', async () => {
    await initRealServicesPage();
    expect(document.querySelector('#real-services-root').textContent).toContain('Real Services Check');
  });
});
