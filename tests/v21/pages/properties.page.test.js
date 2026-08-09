import { describe, it, expect, beforeEach } from 'vitest';
import { initPropertiesPage } from '../../../js/v21/pages/properties.page.js';

describe('properties page', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="properties-root"></div>';
  });

  it('initialise la page properties', async () => {
    await initPropertiesPage();
    expect(document.querySelector('#properties-root')).toBeTruthy();
  });
});
