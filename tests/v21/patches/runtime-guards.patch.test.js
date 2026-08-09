import { describe, it, expect } from 'vitest';
import { isBrowser, safeCall, safeAsync } from '../../../js/v21/patches/runtime-guards.patch.js';

describe('runtime guards patch', () => {
  it('détecte le runtime navigateur sous jsdom', () => {
    expect(isBrowser()).toBe(true);
  });

  it('safeCall retourne fallback en cas erreur', () => {
    const result = safeCall(() => { throw new Error('boom'); }, 'fallback', () => {});
    expect(result).toBe('fallback');
  });

  it('safeAsync retourne fallback en cas erreur', async () => {
    const result = await safeAsync(async () => { throw new Error('boom'); }, 'fallback', () => {});
    expect(result).toBe('fallback');
  });
});
