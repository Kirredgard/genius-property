import { describe, it, expect, beforeEach } from 'vitest';
import { shouldLoadLegacy, LEGACY_SCRIPTS } from '../../../js/v21/legacy/legacy-loader.js';

describe('legacy loader', () => {
  beforeEach(() => {
    window.GPV21_ENABLE_LEGACY = false;
    history.replaceState(null, '', '/');
  });

  it('désactive le legacy par défaut', () => {
    expect(shouldLoadLegacy()).toBe(false);
  });

  it('active le legacy via flag global', () => {
    window.GPV21_ENABLE_LEGACY = true;
    expect(shouldLoadLegacy()).toBe(true);
  });

  it('expose la liste des scripts legacy', () => {
    expect(Array.isArray(LEGACY_SCRIPTS)).toBe(true);
  });
});
