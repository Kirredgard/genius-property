import { describe, expect, it } from 'vitest';
import { normalizeFirebaseAuthError } from '../js/v21/modules/auth/auth.module.js';

describe('auth.module', () => {
  it('traduit auth/invalid-credential', () => {
    expect(normalizeFirebaseAuthError({ code: 'auth/invalid-credential' })).toMatch(/incorrect/i);
  });

  it('garde un message inconnu lisible', () => {
    expect(normalizeFirebaseAuthError({ message: 'Erreur test' })).toBe('Erreur test');
  });
});
