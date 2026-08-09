import { describe, it, expect, beforeEach } from 'vitest';
import { shouldLoadHotfixes, HOTFIX_SCRIPTS } from '../../../js/v21/legacy/hotfix-loader.js';

describe('hotfix loader', () => {
  beforeEach(() => {
    window.GPV21_ENABLE_HOTFIXES = false;
    history.replaceState(null, '', '/');
  });

  it('désactive les hotfixes par défaut', () => {
    expect(shouldLoadHotfixes()).toBe(false);
  });

  it('active les hotfixes via flag global', () => {
    window.GPV21_ENABLE_HOTFIXES = true;
    expect(shouldLoadHotfixes()).toBe(true);
  });

  it('expose la liste des hotfixes', () => {
    expect(Array.isArray(HOTFIX_SCRIPTS)).toBe(true);
  });
});
