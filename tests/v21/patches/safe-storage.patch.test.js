import { describe, it, expect, beforeEach } from 'vitest';
import { getStorageValue, setStorageValue, getStorageJSON, setStorageJSON } from '../../../js/v21/patches/safe-storage.patch.js';

describe('safe storage patch', () => {
  beforeEach(() => localStorage.clear());

  it('écrit et lit une valeur', () => {
    expect(setStorageValue('k', 'v')).toBe(true);
    expect(getStorageValue('k')).toBe('v');
  });

  it('gère JSON', () => {
    expect(setStorageJSON('obj', { ok: true })).toBe(true);
    expect(getStorageJSON('obj')).toEqual({ ok: true });
  });

  it('retourne fallback si absent', () => {
    expect(getStorageValue('absent', 'fallback')).toBe('fallback');
  });
});
