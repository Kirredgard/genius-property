import { describe, it, expect, beforeEach } from 'vitest';
import { GPV21_DEMO_DATA, enableDemoMode, disableDemoMode, isDemoModeEnabled, getDemoCollection } from '../../../js/v21/demo/demo-data.js';

describe('demo data', () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, '', '/');
  });

  it('contient des données dashboard', () => {
    expect(GPV21_DEMO_DATA.properties.length).toBeGreaterThan(0);
    expect(GPV21_DEMO_DATA.payments.length).toBeGreaterThan(0);
  });

  it('active et désactive le mode demo', () => {
    enableDemoMode();
    expect(isDemoModeEnabled()).toBe(true);
    expect(getDemoCollection('properties').length).toBeGreaterThan(0);

    disableDemoMode();
    expect(isDemoModeEnabled()).toBe(false);
  });
});
