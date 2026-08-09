import { describe, it, expect, beforeEach } from 'vitest';
import { requireUsageCapacity, countStateItems } from '../../../js/v21/billing/usage-guard.js';
import { persistLocalSubscription } from '../../../js/v21/billing/subscription.service.js';
import { getPlanLimits } from '../../../js/v21/billing/plans.js';

describe('usage guard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('compte les éléments dans un state', () => {
    expect(countStateItems({ properties: [{ id: 1 }] }, 'properties')).toBe(1);
  });

  it('refuse si quota atteint', () => {
    persistLocalSubscription({ agencyId: 'a1', plan: 'free', status: 'active', limits: getPlanLimits('free') });
    expect(requireUsageCapacity('properties', 3).ok).toBe(false);
  });

  it('autorise si quota disponible', () => {
    persistLocalSubscription({ agencyId: 'a1', plan: 'free', status: 'active', limits: getPlanLimits('free') });
    expect(requireUsageCapacity('properties', 2).ok).toBe(true);
  });
});
