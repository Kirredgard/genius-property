import { describe, it, expect } from 'vitest';
import { registerLegacyGlobal, getLegacyGlobal, hasLegacyGlobal, unregisterLegacyGlobal } from '../../../js/v21/legacy/legacy-registry.js';

describe('legacy registry', () => {
  it('enregistre et récupère un global legacy', () => {
    registerLegacyGlobal('TEST_LEGACY_FN', () => 'ok');

    expect(hasLegacyGlobal('TEST_LEGACY_FN')).toBe(true);
    expect(getLegacyGlobal('TEST_LEGACY_FN')()).toBe('ok');

    unregisterLegacyGlobal('TEST_LEGACY_FN');
  });

  it('retourne un fallback si absent', () => {
    expect(getLegacyGlobal('ABSENT_LEGACY', 'fallback')).toBe('fallback');
  });
});
