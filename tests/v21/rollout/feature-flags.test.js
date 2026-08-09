import { describe, it, expect, beforeEach } from 'vitest';
import { getFeatureFlags, isFeatureEnabled, setFeatureFlag, resetFeatureFlags } from '../../../js/v21/rollout/feature-flags.js';

describe('feature flags', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retourne les flags par défaut', () => {
    const flags = getFeatureFlags();
    expect(flags.v21Dashboard).toBe(true);
  });

  it('permet de modifier un flag', () => {
    setFeatureFlag('v21OwnerPayouts', true);
    expect(isFeatureEnabled('v21OwnerPayouts')).toBe(true);

    resetFeatureFlags();
    expect(getFeatureFlags().v21OwnerPayouts).toBe(false);
  });
});
