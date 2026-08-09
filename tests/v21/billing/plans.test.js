import { describe, it, expect } from 'vitest';
import { getPlanLimits } from '../../../js/v21/billing/plans.js';

describe('billing plans', () => {
  it('retourne les limites free', () => {
    expect(getPlanLimits('free').properties).toBe(3);
  });

  it('fallback vers free si plan inconnu', () => {
    expect(getPlanLimits('unknown').properties).toBe(3);
  });
});
